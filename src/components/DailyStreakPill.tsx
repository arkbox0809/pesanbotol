'use client';

import { useDailyStreak } from './DailyStreakProvider';
import { Loader2 } from 'lucide-react';

export default function DailyStreakPill() {
  const { state, loading } = useDailyStreak();

  if (loading || !state) {
    // Skeleton / loading state
    return (
      <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
        <span className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
      </div>
    );
  }

  const day = state.current_streak;
  const completedCycles = state.completed_cycles;
  const hasVoyagerBadge = completedCycles >= 1;

  return (
    <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
      <span className="text-xs font-mono font-medium text-slate-700">
        Day {day}/7
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: 7 }, (_, i) => {
          const filled = i < day;
          return (
            <span key={i} className={`${filled ? 'text-sky-500' : 'text-slate-300'} text-xs font-mono`}>
              {filled ? '●' : '○'}
            </span>
          );
        })}
      </div>
      {hasVoyagerBadge && (
        <span className="ml-1 text-xs font-mono text-amber-600" title="River Voyager badge">⚓</span>
      )}
    </div>
  );
}
