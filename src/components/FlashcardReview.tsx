import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Lightbulb,
  ArrowLeft,
  Zap,
  Volume2,
  VolumeX,
  Check,
  X,
  Keyboard,
  WifiOff,
  Database,
  Timer,
} from 'lucide-react';
import { Card, Subject, Grade } from '../types';
import { scheduleCard, formatInterval } from '../utils/fsrs';
import { useSyncStatus } from '../hooks/useSyncStatus';

interface FlashcardReviewProps {
  subject: Subject;
  cards: Card[];
  onClose: () => void;
  onGradeCard: (cardId: string, grade: Grade) => Promise<{ xpGained: number }>;
  onFinishSession: (stats: {
    totalReviewed: number;
    xpEarned: number;
    gradeCounts: Record<Grade, number>;
    timeSpentSeconds: number;
  }) => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  subject,
  cards,
  onClose,
  onGradeCard,
  onFinishSession,
}) => {
  const { isOnline } = useSyncStatus();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoTTS, setIsAutoTTS] = useState(true);
  const [sessionStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gradeCounts, setGradeCounts] = useState<Record<Grade, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex) / cards.length) * 100) : 0;

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Calculate next intervals for each grade on the current card
  const intervalPreviews = useCallback(() => {
    if (!currentCard) return { 1: '< 10m', 2: '1d', 3: '3d', 4: '7d' };
    const cardState = {
      stability: currentCard.stability,
      difficulty: currentCard.difficulty,
      intervalDays: currentCard.intervalDays,
      repetitions: currentCard.repetitions,
    };
    return {
      1: formatInterval(scheduleCard(cardState, 1).intervalDays),
      2: formatInterval(scheduleCard(cardState, 2).intervalDays),
      3: formatInterval(scheduleCard(cardState, 3).intervalDays),
      4: formatInterval(scheduleCard(cardState, 4).intervalDays),
    };
  }, [currentCard]);

  const intervals = intervalPreviews();

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleGrade = async (grade: Grade) => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await onGradeCard(currentCard.id, grade);
      const gained = res?.xpGained || (grade === 4 ? 20 : grade === 3 ? 15 : grade === 2 ? 10 : 5);

      setSessionXp((prev) => prev + gained);
      setGradeCounts((prev) => ({
        ...prev,
        [grade]: prev[grade] + 1,
      }));

      // Next card or finish
      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        const finalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
        onFinishSession({
          totalReviewed: cards.length,
          xpEarned: sessionXp + gained,
          gradeCounts: {
            ...gradeCounts,
            [grade]: gradeCounts[grade] + 1,
          },
          timeSpentSeconds: finalTime,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut listener (Space = Flip, 1=Again, 2=Hard, 3=Good, 4=Easy)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1);
        else if (e.key === '2') handleGrade(2);
        else if (e.key === '3') handleGrade(3);
        else if (e.key === '4') handleGrade(4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, currentCard, isSubmitting]);

  // Audio speech synthesis helper
  const handleSpeak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Auto-TTS hook
  useEffect(() => {
    if (isAutoTTS && currentCard) {
      handleSpeak(isFlipped ? currentCard.back : currentCard.front);
    }
  }, [isFlipped, currentIndex, isAutoTTS, currentCard, handleSpeak]);

  if (!currentCard) {
    return null;
  }

  return (
    <div
      id="flashcard-review-screen"
      className="fixed inset-0 z-50 bg-[var(--theme-bg)] dark:bg-stone-950 text-[var(--theme-text)] dark:text-stone-100 flex flex-col overflow-y-auto"
    >
      {/* Top Session Navigation Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800 px-3 sm:px-8 py-3 flex items-center justify-between shadow-2xs shrink-0 relative">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="exit-review-btn"
            data-testid="btn-exit-review"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1 flex items-center gap-1.5 sm:gap-2">
              <span className="max-w-[140px] sm:max-w-xs truncate">{subject.title}</span>
              <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-[var(--theme-secondary)] dark:text-[var(--theme-accent)] font-extrabold uppercase">
                Active Recall
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
              Card {currentIndex + 1} of {cards.length}
            </p>
          </div>
        </div>

        {/* Focus Mode Timer Overlay */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 shadow-sm hidden sm:flex">
          <Timer className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
          <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300">
             {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{ (elapsedSeconds % 60).toString().padStart(2, '0') }
          </span>
        </div>

        {/* Progress Bar & XP Indicator */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden md:flex flex-col items-end gap-1 w-36 lg:w-44">
            <div className="flex justify-between w-full text-[11px] font-bold text-stone-500 dark:text-stone-400">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--theme-accent)] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold shadow-2xs">
            <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
            <span>+{sessionXp} XP</span>
          </div>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col justify-center items-center">
        {/* Offline Mode Notice Banner */}
        {!isOnline && (
          <div
            id="review-offline-notice"
            className="w-full mb-3 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center justify-between text-xs shadow-xs"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold">
                Offline Mode Active · Reviews & FSRS spaced intervals are calculated locally and queued in IndexedDB.
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <Database className="w-3.5 h-3.5" />
              <span>Local Sync</span>
            </div>
          </div>
        )}

        {/* The 3D Interactive Card */}
        <div
          id="flashcard-box"
          data-testid="flashcard-box"
          onClick={handleFlip}
          className="w-full min-h-[260px] sm:min-h-[360px] max-h-[550px] bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-md hover:shadow-lg transition-all duration-300 p-5 sm:p-10 flex flex-col justify-between cursor-pointer relative select-none group"
        >
          {/* Card Top Label */}
          <div className="flex items-center justify-between text-xs font-bold text-stone-400 dark:text-stone-500">
            <span className="uppercase tracking-wider flex items-center gap-1">
              {isFlipped ? (
                <span className="text-[var(--theme-secondary)] dark:text-[var(--theme-accent)] bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] px-2.5 py-1 rounded-md text-[10px] sm:text-xs">
                  Answer (Definition)
                </span>
              ) : (
                <span className="text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md text-[10px] sm:text-xs">
                  Prompt (Active Recall)
                </span>
              )}
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAutoTTS(!isAutoTTS);
                }}
                title={isAutoTTS ? "Disable Auto Read Aloud" : "Enable Auto Read Aloud"}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                  isAutoTTS 
                    ? "text-[var(--theme-secondary)] dark:text-[var(--theme-accent)] bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)]" 
                    : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                {isAutoTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">Auto TTS</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(isFlipped ? currentCard.back : currentCard.front);
                }}
                title="Speak text"
                className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 group-hover:bg-stone-200 dark:group-hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flip (Space)</span>
                <span className="sm:hidden">Flip</span>
              </button>
            </div>
          </div>

          {/* Card Body Text */}
          <div className="my-auto py-4 sm:py-6 text-center">
            {isFlipped ? (
              <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
                <p className="text-lg sm:text-2xl font-bold text-stone-900 dark:text-stone-100 leading-relaxed font-display">
                  {currentCard.back}
                </p>
                {currentCard.hint && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 italic bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 inline-block px-3 py-1 rounded-lg">
                    💡 Memory trigger: {currentCard.hint}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-lg sm:text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-100 leading-snug font-display">
                  {currentCard.front}
                </p>
                {currentCard.hint && (
                  <div className="pt-2">
                    {showHint ? (
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Hint: {currentCard.hint}</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold transition-colors"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Reveal Hint</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Bottom: Tags & Flip Tip */}
          <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 pt-3 sm:pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              {currentCard.tags.map((t) => (
                <span key={t} className="text-[10px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 hidden sm:inline">
              Click anywhere or press Space to flip
            </span>
          </div>
        </div>

        {/* FSRS Rating Controls (Visible when Flipped) */}
        <div className="w-full mt-4 sm:mt-6">
          {isFlipped ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1: Again */}
                <button
                  id="grade-again-btn"
                  data-testid="btn-grade-again"
                  disabled={isSubmitting}
                  onClick={() => handleGrade(1)}
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[54px] rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                >
                  <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1">
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />
                    <span>Again</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                    {intervals[1]} <span className="hidden sm:inline">(Key 1)</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-rose-500 font-medium">+5 XP</span>
                </button>

                {/* 2: Hard */}
                <button
                  id="grade-hard-btn"
                  data-testid="btn-grade-hard"
                  disabled={isSubmitting}
                  onClick={() => handleGrade(2)}
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[54px] rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                >
                  <span className="text-xs sm:text-sm font-extrabold">Hard</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                    {intervals[2]} <span className="hidden sm:inline">(Key 2)</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-amber-600 font-medium">+10 XP</span>
                </button>

                {/* 3: Good */}
                <button
                  id="grade-good-btn"
                  data-testid="btn-grade-good"
                  disabled={isSubmitting}
                  onClick={() => handleGrade(3)}
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[54px] rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                >
                  <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Good</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {intervals[3]} <span className="hidden sm:inline">(Key 3)</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">+15 XP</span>
                </button>

                {/* 4: Easy */}
                <button
                  id="grade-easy-btn"
                  data-testid="btn-grade-easy"
                  disabled={isSubmitting}
                  onClick={() => handleGrade(4)}
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[54px] rounded-2xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-300 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                >
                  <span className="text-xs sm:text-sm font-extrabold">Easy</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-sky-700 dark:text-sky-400 mt-0.5">
                    {intervals[4]} <span className="hidden sm:inline">(Key 4)</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-sky-600 font-medium">+20 XP</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center justify-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 pt-1">
                <Keyboard className="w-3.5 h-3.5" />
                <span>Press keys 1, 2, 3, or 4 on your keyboard</span>
              </div>
            </div>
          ) : (
            <button
              id="show-answer-btn"
              data-testid="btn-show-answer"
              onClick={handleFlip}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-sm sm:text-base font-bold shadow-md shadow-stone-500/30 transition-all cursor-pointer hover:scale-[1.01]"
            >
              Show Answer (Space)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
