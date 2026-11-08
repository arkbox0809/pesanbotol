# Fix: Daily Streak RPC Error "Gagal mencatat kunjungan streak: {}"

## Root Cause Analysis

The console error `Gagal mencatat kunjungan streak: {}` originates from `src/lib/dailyStreak.ts` line 85, inside the `catch (err)` block. The `JSON.stringify(err)` returns `"{}"` because Supabase/PostgrestError objects have non-enumerable properties, so stringifying them produces an empty object.

### Likely Causes (in order of probability)

1. **Migration not applied to DB** — Per AGENTS.md, "A migration file present != applied." If the `record_daily_visit` RPC doesn't exist in the database, Supabase returns a `PostgrestError` with `code: "42883"` (function does not exist). This error is caught and logged as `{}`.

2. **SQL syntax errors in migration** — The migration file (`supabase/migrations/202611060001_daily_streaks.sql`) has multiple PL/pgSQL syntax errors that would prevent the function from being created even if the migration was run:
   - `DECLARE` is used inside the function body (lines 40, 72-74). In PL/pgSQL, `DECLARE` is only valid in the `DECLARE` block before `BEGIN`, not inside the function body.
   - Function is declared `RETURNS JSON` but uses `jsonb_build_object` which returns `JSONB`. This is a type mismatch.
   - Missing `SECURITY DEFINER` clause (required per plan for anti-tampering).
   - The `v_just_completed` logic only sets `TRUE` when `completed_cycles = 0`, meaning it would only trigger on the very first completion ever, not subsequent cycles.
   - The "Day 7 → new cycle" logic (line 111-122) checks `v_row.last_visit_date > p_local_date` which is impossible since `last_visit_date` was already set to `p_local_date` in the preceding UPDATE.

3. **Poor error logging** — `JSON.stringify(err)` on Supabase errors returns `"{}"` because error properties (`message`, `details`, `hint`, `code`) are non-enumerable. This makes debugging impossible.

4. **`.single()` on RPC result** — The RPC returns a single JSON value. Using `.single()` on a scalar JSON result can fail if the RPC returns null or no data.

## Steps to Fix (for implementation agent)

### A. Fix Error Logging (src/lib/dailyStreak.ts)

Replace the error logging in both the `if (error)` block and the `catch (err)` block to use Supabase error properties instead of `JSON.stringify`:

```typescript
// In if (error) block:
console.error('[PesanBotol] Gagal mencatat kunjungan streak:', {
  message: error?.message,
  details: error?.details,
  hint: error?.hint,
  code: error?.code,
});

// In catch (err) block:
const detail = err instanceof Error
  ? err.message
  : (err && typeof err === 'object' && 'message' in err)
    ? String((err as { message?: unknown }).message)
    : String(err);
console.error('[PesanBotol] Gagal mencatat kunjungan streak:', detail);
```

### B. Rewrite Migration SQL (supabase/migrations/202611060001_daily_streaks.sql)

Fix all PL/pgSQL syntax errors:

1. Move all `DECLARE` statements to the `DECLARE` block before `BEGIN`.
2. Change `RETURNS JSON` to `RETURNS JSONB` (or cast `jsonb_build_object` result to `JSON`).
3. Add `SECURITY DEFINER` to the function definition.
4. Fix `v_just_completed` logic: set `TRUE` whenever `v_new_streak >= 7` (not just when `completed_cycles = 0`).
5. Fix the "Day 7 → new cycle" logic: check if `v_row.current_streak >= 7` BEFORE updating, not after.
6. Remove the impossible `v_row.last_visit_date > p_local_date` check.

### C. Remove `.single()` from RPC call (src/lib/dailyStreak.ts)

Change:
```typescript
const { data, error } = await supabase
  .rpc('record_daily_visit', { p_device_token: deviceToken, p_local_date: isoLocal })
  .single();
```
To:
```typescript
const { data, error } = await supabase
  .rpc('record_daily_visit', { p_device_token: deviceToken, p_local_date: isoLocal });
```

### D. Apply Migration to Database

The migration needs to be applied to the Supabase database. This requires explicit approval per AGENTS.md ("Never apply schema changes without explicit approval").

### E. Add Graceful Degradation

Ensure the pill component handles the case where the RPC fails gracefully (already partially done via null checks, but the error logging should be improved).

## Prevention Steps

1. **Improve error logging**: Always use Supabase error properties (`error.message`, `error.code`, `error.details`, `error.hint`) instead of `JSON.stringify(error)`.
2. **Validate SQL before applying**: Test migration SQL in a local Supabase instance or use `psql` dry-run before applying.
3. **Add migration status check**: Consider adding a startup check that verifies required RPC functions exist.
4. **Use `.single()` carefully**: Only use `.single()` when the query is guaranteed to return exactly one row. For RPC calls returning scalars, omit `.single()`.
5. **Test RPC in isolation**: Before integrating, test the RPC function directly via Supabase SQL editor.
6. **Add console logging for RPC parameters**: Log the parameters being sent to the RPC to help debug parameter-related issues.

## Files to Modify

- `src/lib/dailyStreak.ts` — Fix error logging, remove `.single()`
- `supabase/migrations/202611060001_daily_streaks.sql` — Fix PL/pgSQL syntax errors, add SECURITY DEFINER, fix logic bugs
- Apply migration to database (requires approval)

## Validation

- Run `npx tsc --noEmit` — must pass
- Run `npm run build` — must pass
- Test RPC manually via Supabase SQL editor
- Verify no console errors in browser dev tools
