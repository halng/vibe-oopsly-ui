import React, { useState, useMemo } from 'react';
import {
  Brain,
  X,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Subject, Card } from '../types';

interface LearnModeModalProps {
  subject: Subject;
  cards: Card[];
  onClose: () => void;
  onRewardXp: (xp: number) => void;
}

export const LearnModeModal: React.FC<LearnModeModalProps> = ({
  subject,
  cards,
  onClose,
  onRewardXp,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];

  // Dynamically create 4 multiple-choice options with 1 correct answer and 3 random distractors
  const options = useMemo(() => {
    if (!currentCard) return [];
    const correct = currentCard.back;
    const otherCards = cards.filter((c) => c.id !== currentCard.id);
    const distractors = otherCards
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((c) => c.back);

    const all = [correct, ...distractors];
    return all.sort(() => 0.5 - Math.random());
  }, [currentCard, cards]);

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
    setIsAnswerSubmitted(true);

    const isCorrect = opt === currentCard.back;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      onRewardXp(15);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCorrectCount(0);
    setIsFinished(false);
  };

  if (!cards.length) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <p className="text-sm text-stone-600">No cards in this deck to practice.</p>
          <button onClick={onClose} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="learn-mode-modal"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                Learn Mode: {subject.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                Question {currentIndex + 1} of {cards.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isFinished ? (
          <div className="py-6 sm:py-8 text-center space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">Quiz Completed!</h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                You scored <span className="font-bold text-emerald-600 dark:text-emerald-400">{correctCount}</span> out of{' '}
                <span className="font-bold">{cards.length}</span> correct ({Math.round((correctCount / cards.length) * 100)}%).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-sm shadow-[#8BC34A]/30 cursor-pointer"
              >
                <span>Back to Library</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Prompt */}
            <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400 dark:text-stone-500">
                Identify the correct answer:
              </span>
              <p className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100 mt-1.5 sm:mt-2 font-display">
                {currentCard.front}
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2 sm:space-y-2.5">
              {options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === currentCard.back;
                let optionStyle =
                  'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100';

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    optionStyle =
                      'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold';
                  } else if (isSelected && !isCorrect) {
                    optionStyle =
                      'bg-rose-50 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500 text-rose-950 dark:text-rose-200';
                  } else {
                    optionStyle =
                      'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all text-xs sm:text-sm flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span className="leading-relaxed">{option}</span>
                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-3" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 ml-3" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Next */}
            {isAnswerSubmitted && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800 animate-in fade-in duration-150">
                <div className="text-xs">
                  {selectedOption === currentCard.back ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Correct! +15 XP
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      Incorrect. The correct answer is highlighted above.
                    </span>
                  )}
                </div>
                <button
                  onClick={handleNext}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold cursor-pointer shrink-0"
                >
                  <span>{currentIndex + 1 < cards.length ? 'Next Question' : 'Finish Quiz'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
