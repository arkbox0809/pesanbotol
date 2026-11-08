# Next Steps: Apply Daily Streak RPC Migration to Supabase Database

## Problem

The `record_daily_visit` RPC function does not exist in the Supabase database. The migration file `supabase/migrations/202611060001_daily_streaks.sql` has been fixed with all syntax errors corrected, but it has not yet been applied to the live database.

**Impact**: The `recordDailyVisit()` function in `src/lib/dailyStreak.ts` calls this RPC and receives a PostgrestError (code `42883` — "function does not exist"), causing the console error "Gagal mencatat kunjungan streak" on every page load.

## Solution: Apply the Migration

### Option A: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Create a **New Query**
5. Copy the **entire contents** of `supabase/migrations/202611060001_daily_streaks.sql`
6. Click **Run**
7. Verify no errors appear in the results

### Option B: Supabase CLI (If Available)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Apply pending migrations
supabase db push
```

### Option C: Direct SQL Execution

If you have direct database access via psql or another tool:
```bash
psql -h <host> -U <user> -d <dbname> -f supabase/migrations/202611060001_daily_streaks.sql
```

## Validation

After applying the migration:

1. **Verify the function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'record_daily_visit';
   ```

2. **Test the RPC manually**:
   ```sql
   SELECT public.record_daily_visit('test-device-token', CURRENT_DATE);
   ```

3. **Verify in the app**:
   - Run `npm run dev`
   - Open browser console
   - Check that "Gagal mencatat kunjungan streak" error is gone
   - Verify the DailyStreakPill displays "Day 1/7" instead of loading state

## Files Already Fixed

- ✅ `src/lib/dailyStreak.ts` — Error logging fixed, `.single()` removed
- ✅ `supabase/migrations/202611060001_daily_streaks.sql` — SQL syntax errors fixed, SECURITY DEFINER added, logic corrected

## Related Files (No Changes Needed)

- `src/components/DailyStreakProvider.tsx` — Already handles null state gracefully
- `src/components/DailyStreakPill.tsx` — Already degrades gracefully on null state
- `src/lib/supabase.ts` — Client is correctly configured