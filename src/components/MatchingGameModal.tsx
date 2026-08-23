import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Gamepad2,
  X,
  Timer,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { Subject, Card } from '../types';

interface MatchingGameModalProps {
  subject: Subject;
  cards: Card[];
  onClose: () => void;
  onRewardXp: (xp: number) => void;
}

interface MatchItem {
  id: string;
  cardId: string;
  type: 'front' | 'back';
  text: string;
}

export const MatchingGameModal: React.FC<MatchingGameModalProps> = ({
  subject,
  cards,
  onClose,
  onRewardXp,
}) => {
  const [selectedItem, setSelectedItem] = useState<MatchItem | null>(null);
  const [matchedCardIds, setMatchedCardIds] = useState<Set<string>>(new Set());
  const [mismatchedPair, setMismatchedPair] = useState<[string, string] | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isGameActive, setIsGameActive] = useState(true);
  const [mistakes, setMistakes] = useState(0);

  // Take up to 6 cards for a 12-tile matching board
  const gameCards = useMemo(() => {
    return cards.slice(0, 6);
  }, [cards]);

  // Generate randomized tiles
  const tiles: MatchItem[] = useMemo(() => {
    const items: MatchItem[] = [];
    gameCards.forEach((c) => {
      items.push({
        id: `front-${c.id}`,
        cardId: c.id,
        type: 'front',
        text: c.front,
      });
      items.push({
        id: `back-${c.id}`,
        cardId: c.id,
        type: 'back',
        text: c.back,
      });
    });
    return items.sort(() => 0.5 - Math.random());
  }, [gameCards]);

  // Timer
  useEffect(() => {
    if (!isGameActive) return;
    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameActive]);

  // Check victory condition
  useEffect(() => {
    if (gameCards.length > 0 && matchedCardIds.size === gameCards.length) {
      setIsGameActive(false);
      const earnedXp = Math.max(20, 100 - secondsElapsed * 2 - mistakes * 5);
      onRewardXp(earnedXp);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [matchedCardIds, gameCards, secondsElapsed, mistakes]);

  const handleTileClick = (tile: MatchItem) => {
    if (matchedCardIds.has(tile.cardId)) return;
    if (mismatchedPair) return;

    if (!selectedItem) {
      setSelectedItem(tile);
      return;
    }

    if (selectedItem.id === tile.id) {
      setSelectedItem(null);
      return;
    }

    // Match check: must be same cardId but different type (front vs back)
    if (selectedItem.cardId === tile.cardId && selectedItem.type !== tile.type) {
      // Success match!
      setMatchedCardIds((prev) => new Set([...prev, tile.cardId]));
      setSelectedItem(null);
    } else {
      // Mismatch
      setMismatchedPair([selectedItem.id, tile.id]);
      setMistakes((m) => m + 1);
      setTimeout(() => {
        setMismatchedPair(null);
        setSelectedItem(null);
      }, 700);
    }
  };

  const handleRestart = () => {
    setMatchedCardIds(new Set());
    setSelectedItem(null);
    setMismatchedPair(null);
    setSecondsElapsed(0);
    setMistakes(0);
    setIsGameActive(true);
  };

  return (
    <div
      id="matching-game-modal"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full p-4 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header with Live Stopwatch */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                Matching Game: {subject.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                Match every prompt to its corresponding definition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold font-mono">
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-500" />
              <span>
                {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isGameActive ? (
          /* Victory Stage */
          <div className="py-8 sm:py-10 text-center space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">All Cleared!</h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Completed in <span className="font-bold text-stone-800 dark:text-stone-200">{secondsElapsed}s</span> with{' '}
                <span className="font-bold text-stone-800 dark:text-stone-200">{mistakes}</span> mistakes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-sm shadow-stone-500/30 cursor-pointer"
              >
                <span>Return to Library</span>
              </button>
            </div>
          </div>
        ) : (
          /* Game Grid */
          <div className="py-4 sm:py-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {tiles.map((tile) => {
                const isMatched = matchedCardIds.has(tile.cardId);
                const isSelected = selectedItem?.id === tile.id;
                const isMismatched = mismatchedPair && mismatchedPair.includes(tile.id);

                let tileStyle =
                  'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 shadow-2xs';

                if (isMatched) {
                  tileStyle =
                    'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 opacity-40 pointer-events-none scale-95';
                } else if (isMismatched) {
                  tileStyle =
                    'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200 animate-shake';
                } else if (isSelected) {
                  tileStyle =
                    'bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] border-[var(--theme-accent)] text-[#33691E] dark:text-[var(--theme-accent)] font-bold ring-2 ring-[color-mix(in_srgb,var(--theme-accent)_40%,transparent)] scale-102';
                }

                return (
                  <button
                    key={tile.id}
                    disabled={isMatched}
                    onClick={() => handleTileClick(tile)}
                    className={`min-h-[80px] sm:min-h-[100px] p-2.5 sm:p-3.5 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-center text-center transition-all cursor-pointer leading-relaxed ${tileStyle}`}
                  >
                    <span className="line-clamp-4">{tile.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-400 dark:text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-800">
              <span>
                Matched: {matchedCardIds.size} / {gameCards.length} pairs
              </span>
              <span>Mistakes: {mistakes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
