'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { recordDailyVisit, type StreakState, getStreakLastCompletedCycles, setStreakLastCompletedCycles } from '@/lib/dailyStreak';

interface DailyStreakContextType {
  state: StreakState | null;
  loading: boolean;
  justCompleted: boolean;
  recordVisit: () => Promise<void>;
}

const DailyStreakContext = createContext<DailyStreakContextType | undefined>(undefined);

export function DailyStreakProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StreakState | null>(null);
  const [loading, setLoading] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const SESSION_KEY = 'pesanbotol_streak_recorded_session';

  // On mount: lakukan kunjungan sekali, cegah duplicate antar tab
  useEffect(() => {
    const recorded = sessionStorage.getItem(SESSION_KEY);
    if (!recorded) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      recordVisit();
    }
  }, []);

  // Visibilitychange: re-record saat tab terlihat (dedupe di server)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordVisit();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Toast auto-dismiss: sembunyikan toast setelah 4 detik saat justCompleted nyala
  useEffect(() => {
    let timer: any;
    if (justCompleted) {
      timer = window.setTimeout(() => {
        setJustCompleted(false);
      }, 4000);
    }
    return () => {
      window.clearTimeout(timer);
    };
  }, [justCompleted]);

  const recordVisit = async () => {
    setLoading(true);
    try {
      const result = await recordDailyVisit();
      if (result.state) {
        setState(result.state);
        // Toast dedup: tampilkan jika justCompleted ATAU completed_cycles > last_completed_cycles yang tersimpan
        const prevCycles = getStreakLastCompletedCycles();
        if (result.justCompleted || result.state.completed_cycles > prevCycles) {
          setJustCompleted(true);
          // Update localStorage setelah toast ditampilkan
          setStreakLastCompletedCycles(result.state.completed_cycles);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DailyStreakContext.Provider value={{ state, loading, justCompleted, recordVisit }}>
      {children}
      {justCompleted && (
        <div className="fixed bottom-20 left-1/2 z-[999] -translate-x-1/2 animate-fade-in rounded-lg border border-sky-200/40 bg-sky-900/95 px-4 py-3 text-center text-sm font-medium text-sky-100 backdrop-blur-sm shadow-lg">
          {state && state.completed_cycles > 0 && state.completed_cycles <= 1
            ? 'Siklus 7 hari selesai! 🌊 River Voyager'
            : 'Your streak survived! 🌊'}
        </div>
      )}
    </DailyStreakContext.Provider>
  );
}

export function useDailyStreak() {
  const context = useContext(DailyStreakContext);
  if (!context) throw new Error('useDailyStreak must be used within DailyStreakProvider');
  return context;
}
