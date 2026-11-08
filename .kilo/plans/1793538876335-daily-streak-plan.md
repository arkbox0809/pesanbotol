# 7-Day Daily Visit Streak — Implementation Plan

## 1. Existing architecture yang relevan

### Identity
- Anonymous identity = `owner_token` (UUID) generated client-side in `src/lib/auth.ts` (`getDeviceToken()`), stored in `localStorage` under `pesanbotol_device_token`. No user accounts, no email auth.
- Entitlements (special bottles, archive) disimpan client-side di localStorage (`pesanbotol_has_special_bottles`, `pesanbotol_has_archive`) via `grantSpecialBottleAccess` / `grantArchiveAccess`.
- Backend: Supabase anon key; RLS saat ini permisif (`USING (true)`) untuk `notification_queue` dan `push_subscriptions`.

### Feed & bottle lifecycle
- `src/app/page.tsx` (home) dan `src/app/explore/[laut]/OceanFeed.tsx` (per-laut) menampilkan botol. Botol biasa expire 3 hari (`getDefaultExpiresAt` di supabase.ts, `expires_at`).
- Reply chains: prefix `Balasan untuk <id>:` (MAX_CHAIN_REPLIES=5).
- Moderation: `reportBottle` increments `report_count`, hide at >=3.

### Notifikasi
- `src/lib/notifications.ts`: `notification_queue` (device_token, target_bottle_id, content, is_read, created_at) + `push_subscriptions`. Pattern: fire-and-forget insert, RLS USING(true).

### UI shell
- Header nav di page.tsx dan OceanFeed.tsx: NotificationBell, Dukung Arus, Hanyutkan Pesan, Explore, LegalMenu.
- Modal: SupportModal, MessageModal, MemoryArchiveModal.
- Styling: Tailwind v4, global.css keyframes, `animate-fade-in`.

### Supabase migrations
- File SQL di `supabase/migrations/` (5 file). File != applied; perlu approval untuk apply.

## 2. Recommended database design

### Tabel baru: `daily_streaks`
```sql
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  device_token TEXT PRIMARY KEY,
  current_streak INT NOT NULL DEFAULT 0 CHECK (current_streak BETWEEN 0 AND 7),
  last_visit_date DATE NOT NULL,
  grace_available BOOLEAN NOT NULL DEFAULT TRUE,
  completed_cycles INT NOT NULL DEFAULT 0,
  last_completed_at DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RPC: `record_daily_visit(p_device_token TEXT, p_local_date DATE)`
SECURITY DEFINER, plpgsql. Logic:
1. Validate `p_device_token` non-empty; `p_local_date` valid date within ±1 day of server UTC date (sanity bound). Jika invalid → return state tanpa perubahan, `accepted=false`.
2. `SELECT ... FOR UPDATE` baris (atau insert jika belum ada).
3. Jika belum ada baris → insert current_streak=1, last_visit_date=p_local_date, grace_available=true, completed_cycles=0. Return `just_completed=false`.
4. Jika p_local_date == last_visit_date → idempotent, return state, `just_completed=false`.
5. Jika p_local_date <= last_visit_date (backdate) → return state, `accepted=false`.
6. Hitung gap hari (p_local_date - last_visit_date) dalam hari:
   - gap == 1: consecutive → current_streak += 1.
   - gap == 2 & grace_available & current_streak BETWEEN 1 AND 6: gunakan grace → current_streak += 1, grace_available=false.
   - lainnya: reset → current_streak=1, grace_available=true.
7. Jika setelah increment current_streak == 7:
   - completed_cycles += 1; last_completed_at = p_local_date; `just_completed=true`.
   - (current_streak tetap 7 untuk tampilan; siklus baru dimulai kunjungan berikutnya)
8. Jika current_streak sudah 7 dan p_local_date > last_visit_date (kunjungan setelah selesai): mulai siklus baru → current_streak=1, grace_available=true.
9. Update last_visit_date=p_local_date, updated_at=now(). Return state + `just_completed`.

### Dedupe
- Idempotent pada tanggal yang sama (step 4).
- Race condition ditangani dengan `SELECT ... FOR UPDATE` dalam transaksi.
- Multiple tabs / refresh → server dedupe by date.

### Tidak ada tabel visits log terpisah (MVP, keep simple).

## 3. RLS/security approach

- Enable RLS pada `daily_streaks`.
- Policy SELECT untuk anon: `USING (true)` (konsisten dengan notification_queue; device_token disaring di query client).
- Tidak ada policy INSERT/UPDATE/DELETE untuk anon → direct write ditolak.
- Semua write hanya via RPC `record_daily_visit` (SECURITY DEFINER). Grant EXECUTE ke anon.
- RPC memvalidasi input (device_token non-empty, date sanity bound) untuk mencegah manipulasi sederhana.
- Catatan: device_token client-controlled (sudah didokumentasikan di AGENTS.md). Untuk streak cosmetic, risiko dapat diterima; tidak digunakan untuk entitlement berbayar.

## 4. Streak logic

### State yang disimpan
- `current_streak`: 1-7 (0 sebelum kunjungan pertama).
- `last_visit_date`: tanggal lokal terakhir yang tercatat.
- `grace_available`: apakah grace masih tersedia di siklus ini.
- `completed_cycles`: jumlah siklus 7 hari yang selesai (lifetime, untuk badge).
- `last_completed_at`: tanggal penyelesaian siklus terakhir (untuk toast dedup).

### Client
- `src/lib/dailyStreak.ts`: tipe `StreakState`, fungsi `recordDailyVisit(deviceToken)` yang memanggil RPC dengan local date (`YYYY-MM-DD` dari `new Date()` lokal, bukan UTC), mengembalikan state + `just_completed`.
- Toast dedup: tampilkan toast jika `just_completed` ATAU `completed_cycles > localStorage.pesanbotol_streak_last_completed_cycles`. Update localStorage setelahnya.
- Badge "River Voyager" diturunkan dari `completed_cycles >= 1`.

### Hari & timezone
- Tanggal lokal dihitung di client: `${y}-${mm}-${dd}` dari `new Date()` (device local).
- Server sanity bound ±1 hari dari server UTC date.

### Edge cases
- First visit: baris baru, streak=1.
- Consecutive: +1.
- Missed 1 day + grace available: +1, grace consumed.
- Missed 1 day + grace used: reset ke 1.
- Missed 2+ days: reset ke 1, grace reset.
- Day 7 completion: completed_cycles++, toast, current_streak=7.
- Kunjungan setelah Day 7: siklus baru, streak=1.
- Same-day duplicate: idempotent, no change.
- Backdate / future date beyond bound: ditolak, state tidak berubah.

## 5. UI/UX

### Widget: `DailyStreakPill`
- Pill kecil di header, dekat judul, pada page.tsx, OceanFeed.tsx, write/page.tsx.
- Tampilkan `Day X/7` + 7 dot (● filled, ○ empty).
- Responsif, minimalis, tidak mengganggu mobile.
- Loading state: placeholder/skeleton sebelum data siap.

### Provider: `DailyStreakProvider`
- Client component di root layout (`src/app/layout.tsx`), membungkus children.
- On mount: panggil `recordDailyVisit` sekali (guard sessionStorage `pesanbotol_streak_recorded_session`).
- On `visibilitychange` (tab visible): re-record (server dedupe) — event-driven, bukan polling.
- Expose state via context untuk pill dan toast.
- Toast global (portal/absolute) saat siklus selesai, muncul sekali.

### Toast
- Kecil, non-blocking, auto-dismiss ~4s.
- Teks: "Siklus 7 hari selesai! 🌊 River Voyager" / "Your streak survived! 🌊".

### Tidak ada modal popup setiap buka app.

## 6. Files to modify/create

### Create
- `supabase/migrations/<date>_daily_streaks.sql` — tabel + RLS + RPC.
- `src/lib/dailyStreak.ts` — tipe + RPC wrapper + helpers.
- `src/components/DailyStreakProvider.tsx` — context + recording + toast.
- `src/components/DailyStreakPill.tsx` — pill UI.

### Modify
- `src/app/layout.tsx` — bungkus children dengan DailyStreakProvider.
- `src/app/page.tsx` — tambah DailyStreakPill di header (dekat judul).
- `src/app/explore/[laut]/OceanFeed.tsx` — tambah DailyStreakPill di header.
- `src/app/write/page.tsx` — tambah DailyStreakPill di header (opsional, konsistensi).

### Tidak diubah
- `src/lib/auth.ts` (entitlements tidak disentuh).
- `src/lib/supabase.ts` (kecuali jika perlu helper; RPC dipanggil langsung).
- `src/lib/notifications.ts`.
- Bottle feed, reply chain, moderation, Peti Kenangan, Dukung Arus.

## 7. Potential risks/regressions

- **RLS/migration belum applied**: RPC call gagal → client catch, pill hidden, tidak crash. Konsisten dengan notifications.ts pattern.
- **device_token null** (storage diblokir): streak tidak aktif. Konsisten dengan existing.
- **Supabase null** (env missing): streak tidak aktif. Konsisten.
- **Clock skew / manipulasi tanggal**: server sanity bound ±1 hari; residual risk diterima (cosmetic, no money).
- **Race condition concurrent tabs**: mitigated by row lock.
- **Toast missed on reload**: mitigated by localStorage dedup comparison.
- **Peti Kenangan / Dukung Arus**: tidak disentuh; streak hanya membaca device_token, tidak mengubah entitlements.
- **Bottle 3-day expiry / feed / RLS**: tidak disentuh.
- **Performa**: satu RPC call per mount + visibilitychange; tidak ada polling/realtime.

## 8. Implementation order

1. Buat migration SQL (tabel + RLS + RPC). (Perlu approval untuk apply ke DB.)
2. Buat `src/lib/dailyStreak.ts`.
3. Buat `DailyStreakProvider` + `DailyStreakPill`.
4. Integrasi provider di layout + pill di page.tsx / OceanFeed.tsx / write/page.tsx.
5. Typecheck (`npx tsc --noEmit`) + build (`npm run build`).
6. Manual smoke test: first visit, consecutive, missed day + grace, Day 7 completion + toast, same-day duplicate, reset after 2 missed days.

## Open questions (resolved)
- Day boundary: local calendar day (A). ✓
- Grace Day: 1 per 7-day cycle, covers 1 missed day (A). ✓
- Reward: milestone visual only (A). ✓
- Trigger/UI: A1 + B1. ✓

## IMPLEMENTATION READY: YES
All design decisions resolved; no blocking unknowns. Migration requires DB approval before apply. Email login (dari request awal) ditunda/out of scope untuk MVP ini; streak menggunakan device_token yang sudah ada.
filePath">
C:\Users\ADVAN\Desktop\pesan-botol\.kilo\plans\1793538876335-daily-streak-plan.md