import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  X,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  HelpCircle,
} from 'lucide-react';
import { Subject, TestSuite, Question } from '../types';
import { ApiService } from '../services/api';

interface TestSuiteModalProps {
  subject: Subject;
  testSuite?: TestSuite;
  onClose: () => void;
  onRewardXp: (xp: number) => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({
  subject,
  testSuite,
  onClose,
  onRewardXp,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    percentage: number;
    xpGained: number;
    breakdown: any[];
  } | null>(null);

  // Load or generate questions from subject cards if testSuite is missing questions
  useEffect(() => {
    if (testSuite?.questions && testSuite.questions.length > 0) {
      setQuestions(testSuite.questions);
      setSecondsRemaining((testSuite.timeLimitMinutes || 10) * 60);
    } else {
      // Create fallback questions from cards
      ApiService.getSubject(subject.id).then((res) => {
        if (res.isSuccess && res.data?.cards) {
          const generatedQuestions: Question[] = res.data.cards.slice(0, 5).map((card, idx) => {
            const otherCards = res.data!.cards.filter((c) => c.id !== card.id);
            const distractors = otherCards.slice(0, 3).map((c) => c.back);
            const allOpts = [card.back, ...distractors].sort(() => 0.5 - Math.random());
            const correctIndex = allOpts.indexOf(card.back);

            return {
              id: `q-gen-${idx}`,
              testSuiteId: testSuite?.id || 'ts-default',
              prompt: card.front,
              options: allOpts,
              correctOptionIndex: correctIndex >= 0 ? correctIndex : 0,
              explanation: `Correct definition: ${card.back}`,
            };
          });
          setQuestions(generatedQuestions);
        }
      });
    }
  }, [testSuite, subject]);

  // Countdown timer
  useEffect(() => {
    if (results !== null || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((s) => {
        if (s <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [results, secondsRemaining]);

  const handleSelectAnswer = (qId: string, optIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optIndex,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let score = 0;
      const breakdown = questions.map((q) => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = userAnswer === q.correctOptionIndex;
        if (isCorrect) score += 1;
        return {
          questionId: q.id,
          prompt: q.prompt,
          userAnswer,
          correctAnswer: q.correctOptionIndex,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const total = questions.length || 1;
      const percentage = Math.round((score / total) * 100);
      const xpGained = score * 25 + 50;

      onRewardXp(xpGained);

      setResults({
        score,
        totalQuestions: questions.length,
        percentage,
        xpGained,
        breakdown,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div
      id="test-suite-modal"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full p-4 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header with Timer */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                {testSuite?.title || `Practice Test: ${subject.title}`}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                {results === null
                  ? `Question ${currentQuestionIndex + 1} of ${questions.length}`
                  : 'Test Results & Answer Breakdown'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {results === null && (
              <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold font-mono">
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-500" />
                <span>
                  {Math.floor(secondsRemaining / 60)}:
                  {(secondsRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {results !== null ? (
          /* Results Breakdown View */
          <div className="py-4 sm:py-6 space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-stone-50 dark:from-emerald-950/30 dark:to-stone-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Assessment Final Score
                </div>
                <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1">
                  {results.score} / {results.totalQuestions} ({results.percentage}%)
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  {results.percentage >= 80
                    ? 'Excellent mastery of this deck!'
                    : 'Good practice run. Keep reviewing the missed concepts.'}
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400 text-sm font-bold shadow-2xs">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>+{results.xpGained} XP Earned</span>
              </div>
            </div>

            {/* Questions Review List */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                Question Review & Explanations
              </h4>
              {results.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-4 rounded-2xl border ${
                    item.isCorrect
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                  } space-y-2 text-xs`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      Q{idx + 1}. {item.prompt}
                    </span>
                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold shrink-0">
                        <XCircle className="w-4 h-4" /> Missed
                      </span>
                    )}
                  </div>
                  {item.explanation && (
                    <p className="text-stone-600 dark:text-stone-300 bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-700 mt-1">
                      💡 {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">Loading questions...</div>
        ) : (
          /* Active Test Taking View */
          <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Question Prompt */}
            <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400 dark:text-stone-500">
                Question {currentQuestionIndex + 1}
              </span>
              <p className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100 leading-snug font-display">
                {currentQ.prompt}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2 sm:space-y-2.5">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all text-xs sm:text-sm flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] dark:bg-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] border-[var(--theme-accent)] text-[#33691E] dark:text-[var(--theme-accent)] font-bold shadow-2xs'
                        : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <span>{option}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigator Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-xs py-1">
                  {questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 ${
                        currentQuestionIndex === idx
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                          : userAnswers[q.id] !== undefined
                          ? 'bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] dark:bg-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] text-[var(--theme-secondary)] dark:text-[var(--theme-accent)]'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {currentQuestionIndex + 1 < questions.length ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold cursor-pointer"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Submit Test
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
