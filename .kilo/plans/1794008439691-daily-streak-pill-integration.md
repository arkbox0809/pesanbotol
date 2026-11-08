# Plan: Remaining Tasks for 7-Day Daily Visit Streak Feature

## Audit Summary (current state)

### ✅ Done
- DB: `daily_streaks` table + `record_daily_visit` RPC applied (user confirmed "Success. No rows returned").
- `src/lib/dailyStreak.ts` — types, RPC wrapper, localStorage helpers, `hasRiverVoyagerBadge`.
- `src/components/DailyStreakProvider.tsx` — context, mount record, visibilitychange, toast (but see bug below).
- `src/components/DailyStreakPill.tsx` — UI with loading state + badge.
- `src/app/layout.tsx` — provider wired.
- `src/app/page.tsx` — pill rendered in top-left header.

### ❌ Remaining / buggy

## Task 1 — UI: render pill in OceanFeed.tsx (HIGH)
**File:** `src/app/explore/[laut]/OceanFeed.tsx`
- Add import: `import DailyStreakPill from '@/components/DailyStreakPill';`
- Render in top-left header block (`absolute top-6 left-6 z-10 flex flex-col gap-1`), after the subtitle `<p>`.

## Task 2 — UI: render pill in write/page.tsx (HIGH)
**File:** `src/app/write/page.tsx`
- Import already present (line 11).
- Render pill in top-right corner: add wrapper `absolute top-6 right-6 z-10` containing `<DailyStreakPill />` inside `<main>` (pill is `hidden lg:flex`, no mobile impact).

## Task 3 — SQL bug: "visit after Day 7" branch (HIGH, needs DB re-apply)
**File:** `supabase/migrations/202611060001_daily_streaks.sql`, lines 91-105
**Problem:** When `v_row.current_streak >= 7` (visit after a completed cycle), the branch currently:
- increments `completed_cycles` again (double-count),
- sets `just_completed = TRUE` (wrong — this visit starts a NEW cycle, not a completion),
- and uses `SET v_just_completed := TRUE;` (invalid PL/pgSQL syntax for local var).
Per plan spec step 8, this branch should start a new cycle: `current_streak = 1`, `grace_available = TRUE`, no `completed_cycles` increment, `just_completed = FALSE`.
**Fix:** rewrite the branch:
```sql
IF v_row.current_streak >= 7 THEN
  -- Kunjungan setelah siklus selesai: mulai siklus baru
  UPDATE public.daily_streaks
  SET current_streak = 1,
      last_visit_date = p_local_date,
      grace_available = TRUE,
      updated_at = now()
  WHERE device_token = p_device_token
  RETURNING * INTO v_row;
  RETURN jsonb_build_object('state', row_to_json(v_row), 'just_completed', FALSE, 'accepted', TRUE);
END IF;
```
**Also fix** `SET v_just_completed := TRUE;` → `v_just_completed := TRUE;` on the remaining branch (line ~118).
**DB action required:** re-run the (CREATE OR REPLACE) migration in Supabase SQL Editor — requires explicit approval per AGENTS.md.

## Task 4 — Toast auto-dismiss (MEDIUM)
**File:** `src/components/DailyStreakProvider.tsx`
**Problem:** `justCompleted` is set to `true` but never reset → toast stays on screen forever.
**Fix:** add `useEffect` that, when `justCompleted` becomes true, sets a 4s timeout to reset it to false; cleanup on unmount/change.

## Task 5 — Unused helper (LOW, optional)
**File:** `src/lib/dailyStreak.ts`
`hasRiverVoyagerBadge` is exported but unused (badge is derived inline in pill). Either wire it into pill or remove. Out of scope for MVP; leave as-is unless cleanup desired.

## Validation
- `npx tsc --noEmit` passes.
- `npm run build` succeeds.
- Manual: open `/`, `/write`, `/explore/<ocean>` at ≥1024px viewport; confirm pill shows "Day X/7" + dots; toast appears on Day-7 completion and disappears after ~4s; mobile (<1024px) shows no pill and no layout break.
- Console: no "useDailyStreak must be used within DailyStreakProvider" errors.
- DB: re-run migration; verify `SELECT public.record_daily_visit('test-token', CURRENT_DATE)` returns `just_completed: false` on a fresh token and `just_completed: true` only when streak reaches 7.

## Out of scope
- Toast portal (fixed positioning is sufficient).
- Mobile pill variant.
- OceanFeed archive/notifications parity.
- Email login (deferred per original plan).
