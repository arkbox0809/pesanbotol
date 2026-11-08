// ============================================================================
// PesanBotol - Logika Streak Harian 7 Hari (cosmetic only)
// ============================================================================

import { supabase } from '@/lib/supabase';
import { getDeviceToken } from '@/lib/auth';

export interface StreakState {
  device_token: string;
  current_streak: number; // 1-7, 0 sebelum kunjungan pertama
  last_visit_date: string; // YYYY-MM-DD (ISO lokal)
  grace_available: boolean;
  completed_cycles: number; // jumlah siklus 7 hari yang selesai (lifetime)
  last_completed_at: string | null; // YYYY-MM-DD ISO atau null
}

export type RecordDailyVisitResult =
  | { state: StreakState; justCompleted: false; accepted: true }
  | { state: StreakState; justCompleted: true; accepted: true }
  | { state: null; justCompleted: false; accepted: false }; // invalid/backdate

export async function recordDailyVisit(): Promise<RecordDailyVisitResult> {
  if (typeof window === 'undefined') {
    // SSR guard
    return { state: null, justCompleted: false, accepted: false };
  }

  const deviceToken = getDeviceToken();
  if (!deviceToken) {
    return { state: null, justCompleted: false, accepted: false };
  }

  if (!supabase) {
    // Null-safe: konsisten dengan notifications.ts
    return { state: null, justCompleted: false, accepted: false };
  }

  // Hitung tanggal lokal hari ini (YYYY-MM-DD) di zona waktu device (klien)
  const localDate = new Date();
  const isoLocal = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

  try {
    const { data, error } = await supabase
      .rpc('record_daily_visit', { p_device_token: deviceToken, p_local_date: isoLocal });

    if (error) {
      console.error('[PesanBotol] Gagal mencatat kunjungan streak:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });
      return { state: null, justCompleted: false, accepted: false };
    }

    if (!data) {
      return { state: null, justCompleted: false, accepted: false };
    }

    // Data adalah JSON dari RPC, perlu parse ke Tipe TS kita
    const result = data as Record<string, unknown>;
    if (result.state === null) {
      return { state: null, justCompleted: false, accepted: false };
    }

    // Konversi nilai date dari string ISO ke format lokal YYYY-MM-DD untuk konsistensi
    const stateData = result.state as Record<string, unknown>;
    const mappedState: StreakState = {
      device_token: stateData.device_token as string,
      current_streak: stateData.current_streak as number,
      last_visit_date: stateData.last_visit_date as string,
      grace_available: stateData.grace_available as boolean,
      completed_cycles: stateData.completed_cycles as number,
      last_completed_at: stateData.last_completed_at as string | null,
    };

    return {
      state: mappedState,
      justCompleted: Boolean(result.just_completed),
      accepted: Boolean(result.accepted),
    } as RecordDailyVisitResult;
  } catch (err) {
    const detail = err instanceof Error
      ? err.message
      : (err && typeof err === 'object' && 'message' in err)
        ? String((err as { message?: unknown }).message)
        : String(err);
    console.error('[PesanBotol] Gagal mencatat kunjungan streak:', detail);
    return { state: null, justCompleted: false, accepted: false };
  }
}

// Helper untuk membaca state dari localStorage (dedup toast)
const STREAK_LAST_COMPLETED_CYCLES_KEY = 'pesanbotol_streak_last_completed_cycles';

export function getStreakLastCompletedCycles(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = window.localStorage.getItem(STREAK_LAST_COMPLETED_CYCLES_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function setStreakLastCompletedCycles(value: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STREAK_LAST_COMPLETED_CYCLES_KEY, String(value));
  } catch {
    // Abaikan penyimpanan yang gagal (privacy mode, storage quota, dll.)
  }
}

// Badge: River Voyager jika completed_cycles >= 1
export function hasRiverVoyagerBadge(completedCycles: number): boolean {
  return completedCycles >= 1;
}
