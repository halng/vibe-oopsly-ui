import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Zap, CheckCircle2, RotateCcw, BookOpen, ArrowRight, Flame, Timer } from 'lucide-react';
import { Subject, Grade } from '../types';
import { ApiService } from '../services/api';

interface ReviewCompleteScreenProps {
  subject: Subject;
  stats: {
    totalReviewed: number;
    xpEarned: number;
    gradeCounts: Record<Grade, number>;
    timeSpentSeconds?: number;
  };
  dailyGoal: number;
  onReturnToShelf: () => void;
  onPracticeAgain: () => void;
}

export const ReviewCompleteScreen: React.FC<ReviewCompleteScreenProps> = ({
  subject,
  stats,
  dailyGoal,
  onReturnToShelf,
  onPracticeAgain,
}) => {
  useEffect(() => {
    ApiService.getStats().then((res: any) => {
      if (res.isSuccess && res.data) {
        const statsData = res.data;
        const currentReviewed = statsData.reviewedToday ?? statsData.totalStudiedToday ?? 0;
        const previousReviewed = currentReviewed - (stats.totalReviewed || 0);
        
        // Launch confetti if they just crossed their daily goal during this session
        if (previousReviewed < dailyGoal && currentReviewed >= dailyGoal) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#8BC34A', '#FF9800', '#03A9F4', '#4CAF50'],
            zIndex: 9999,
          });
        }
      }
    });
  }, [dailyGoal, stats.totalReviewed]);

  const total = stats.totalReviewed || 1;
  const goodOrEasy = (stats.gradeCounts[3] || 0) + (stats.gradeCounts[4] || 0);
  const accuracyPercent = Math.round((goodOrEasy / total) * 100);
  
  const timeSpentMins = (stats.timeSpentSeconds || 1) / 60;
  const cardsPerMinute = Math.round((stats.totalReviewed || 0) / timeSpentMins);

  return (
    <div
      id="review-complete-modal"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 text-center space-y-5 sm:space-y-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Badge / Trophy Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-[var(--theme-secondary)] dark:text-[var(--theme-accent)] flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--theme-secondary)] dark:text-[var(--theme-accent)]" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Session Completed!
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto">
            Great job reinforcing your memory for{' '}
            <span className="font-bold text-stone-700 dark:text-stone-300">{subject.title}</span>.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 flex flex-col items-center">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
            <span className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-300">
              +{stats.xpEarned}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
              XP Gained
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 flex flex-col items-center">
            <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
            <span className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-300">
              {accuracyPercent}%
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
              Accuracy
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900 flex flex-col items-center">
            <Flame className="w-4 h-4 text-sky-600 dark:text-sky-400 mb-1" />
            <span className="text-base sm:text-lg font-black text-sky-900 dark:text-sky-300">
              {stats.totalReviewed}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400">
              Cards
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 flex flex-col items-center">
            <Timer className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
            <span className="text-base sm:text-lg font-black text-indigo-900 dark:text-indigo-300">
              {cardsPerMinute}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">
              Cards / Min
            </span>
          </div>
        </div>

        {/* Breakdown by FSRS Grade */}
        <div className="bg-stone-50 dark:bg-stone-800/60 rounded-2xl p-3.5 sm:p-4 border border-stone-200/70 dark:border-stone-700 text-left space-y-2">
          <div className="text-[10px] sm:text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Grade Distribution
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-rose-100/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold">
              <div>{stats.gradeCounts[1] || 0}</div>
              <div className="text-[9px] font-semibold text-rose-700 dark:text-rose-400">Again</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold">
              <div>{stats.gradeCounts[2] || 0}</div>
              <div className="text-[9px] font-semibold text-amber-700 dark:text-amber-400">Hard</div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold">
              <div>{stats.gradeCounts[3] || 0}</div>
              <div className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">Good</div>
            </div>
            <div className="p-2 rounded-xl bg-sky-100/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold">
              <div>{stats.gradeCounts[4] || 0}</div>
              <div className="text-[9px] font-semibold text-sky-700 dark:text-sky-400">Easy</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 pt-2">
          <button
            id="practice-again-btn"
            data-testid="btn-practice-again"
            onClick={onPracticeAgain}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again</span>
          </button>

          <button
            id="return-to-shelf-btn"
            data-testid="btn-return-shelf"
            onClick={onReturnToShelf}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-md shadow-stone-500/30 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <span>Return to Library</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
