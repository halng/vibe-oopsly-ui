import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Droplets,
  Coins,
  Sun,
  Sprout,
  Volume2,
  VolumeX,
  Layers,
  CheckCircle2,
  Coffee,
  BookOpen,
  ArrowRight,
  Plus,
  Compass,
  Award,
  Music,
  Check,
  Brain,
  HelpCircle,
  Maximize2,
  Minimize2,
  X,
  ChevronRight,
} from 'lucide-react';
import { Subject, Card, GardenState, SoundscapeType, PlantSpecies } from '../types';
import { GhibliGardenView } from './GhibliGardenView';
import { motion } from 'motion/react';
import {
  startSoundscape,
  stopSoundscape,
  playChime,
  playWaterDropSound,
  playPlantGrowthChime,
} from '../utils/soundscapes';
import {
  GHIBLI_QUOTES,
  saveGardenState,
  loadGardenState,
  getRandomSeedDrop,
  PLANT_SPECIES_CATALOG,
  DEFAULT_SEED_INVENTORY,
} from '../utils/gardenData';
import { ApiService } from '../services/api';

interface StudyPomodoroViewProps {
  subjects: Subject[];
  onRewardXp: (amount: number) => void;
  onRefreshData?: () => void;
}

export const StudyPomodoroView: React.FC<StudyPomodoroViewProps> = ({
  subjects,
  onRewardXp,
  onRefreshData,
}) => {
  // Navigation between Pomodoro Timer & Forest Sanctuary Garden
  const [activeSubTab, setActiveSubTab] = useState<'timer' | 'garden'>('timer');

  // Garden State
  const [gardenState, setGardenState] = useState<GardenState>(() => loadGardenState());

  // Save garden state on update
  useEffect(() => {
    saveGardenState(gardenState);
  }, [gardenState]);

  const handleUpdateGarden = (updater: (prev: GardenState) => GardenState) => {
    setGardenState((prev) => updater(prev));
  };

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(25);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(5);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundscape, setSoundscape] = useState<SoundscapeType>('meadow_breeze');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Deck Study Integration during Pomodoro
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('none');
  const [subjectCards, setSubjectCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [cardsStudiedThisSession, setCardsStudiedThisSession] = useState<number>(0);

  // Fullscreen Study Session State
  const [isFullscreenStudy, setIsFullscreenStudy] = useState<boolean>(false);
  const [isPauseOverlayOpen, setIsPauseOverlayOpen] = useState<boolean>(false);
  const [isFocusCompleting, setIsFocusCompleting] = useState<boolean>(false);

  // Completion celebratory modal
  const [completedRewardModal, setCompletedRewardModal] = useState<{
    dewDrops: number;
    coins: number;
    growthPoints: number;
    seedDrop: { species: PlantSpecies; count: number };
    xpEarned: number;
    minutes: number;
    cardsStudied: number;
  } | null>(null);

  // Random peaceful Ghibli quote
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Soundscape management
  useEffect(() => {
    if (isActive && !isSoundMuted && soundscape !== 'none') {
      startSoundscape(soundscape);
    } else {
      stopSoundscape();
    }
    return () => {
      stopSoundscape();
    };
  }, [isActive, isSoundMuted, soundscape]);

  // Load cards when subject is selected
  useEffect(() => {
    if (selectedSubjectId && selectedSubjectId !== 'none') {
      ApiService.getSubjectCards(selectedSubjectId).then((res) => {
        if (res.isSuccess && res.data) {
          const activeCards = res.data.filter((c) => !c.isDeleted);
          setSubjectCards(activeCards);
          setCurrentCardIndex(0);
          setIsFlipped(false);
          setShowHint(false);
        }
      });
    } else {
      setSubjectCards([]);
    }
  }, [selectedSubjectId]);

  // Countdown timer loop
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsRemaining === 0) {
      // Completed session
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  // Keyboard shortcut listener during active fullscreen study
  useEffect(() => {
    if (!isFullscreenStudy) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePauseFullscreen();
      } else if (e.key === '1' && isFlipped) {
        e.preventDefault();
        handleGradeCard(1);
      } else if (e.key === '2' && isFlipped) {
        e.preventDefault();
        handleGradeCard(2);
      } else if (e.key === '3' && isFlipped) {
        e.preventDefault();
        handleGradeCard(3);
      } else if (e.key === '4' && isFlipped) {
        e.preventDefault();
        handleGradeCard(4);
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHint((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenStudy, isFlipped, currentCardIndex, subjectCards]);

  const handleSessionComplete = () => {
    setIsActive(false);
    stopSoundscape();
    playChime(528, 3.0);

    if (timerMode === 'focus') {
      setIsFocusCompleting(true);

      setTimeout(() => {
        const earnedDew = Math.max(1, Math.round(focusDurationMinutes / 8));
        const earnedCoins = Math.max(5, Math.round(focusDurationMinutes * 1.5));
        const earnedXp = focusDurationMinutes * 4 + cardsStudiedThisSession * 10;
        const growthPointsGained = focusDurationMinutes * 10 + cardsStudiedThisSession * 15;
        const seedDrop = getRandomSeedDrop(focusDurationMinutes);

        onRewardXp(earnedXp);

        handleUpdateGarden((prev) => {
          const seedInventory = { ...(prev.seedInventory || DEFAULT_SEED_INVENTORY) };
          seedInventory[seedDrop.species] = (seedInventory[seedDrop.species] || 0) + seedDrop.count;

          return {
            ...prev,
            dewDrops: prev.dewDrops + earnedDew,
            forestCoins: prev.forestCoins + earnedCoins,
            growthPoints: (prev.growthPoints || 0) + growthPointsGained,
            totalXpContributed: (prev.totalXpContributed || 0) + earnedXp,
            seedInventory,
            totalFocusMinutes: prev.totalFocusMinutes + focusDurationMinutes,
            completedSessionsCount: prev.completedSessionsCount + 1,
            forestLevel: Math.floor((prev.totalFocusMinutes + focusDurationMinutes) / 50) + 1,
          };
        });

        setCompletedRewardModal({
          dewDrops: earnedDew,
          coins: earnedCoins,
          growthPoints: growthPointsGained,
          seedDrop,
          xpEarned: earnedXp,
          minutes: focusDurationMinutes,
          cardsStudied: cardsStudiedThisSession,
        });

        // Switch to break mode
        setTimerMode('break');
        setSecondsRemaining(breakDurationMinutes * 60);
        setIsFocusCompleting(false);
      }, 2500);
    } else {
      // Break completed
      setTimerMode('focus');
      setSecondsRemaining(focusDurationMinutes * 60);
    }
  };

  // Start study action triggered by user
  const handleStartStudyClick = () => {
    // If user chose a study material (subject deck), open fullscreen mode window
    if (selectedSubjectId !== 'none' && subjectCards.length > 0) {
      setIsFullscreenStudy(true);
      setIsPauseOverlayOpen(false);
      setIsActive(true);
      playChime(440, 1.2);

      // Attempt to enter browser fullscreen API if allowed
      try {
        if (document.documentElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (err) {}
    } else {
      // No study material selected: operate as normal in-page Pomodoro
      if (!isActive) {
        playChime(440, 1.2);
      }
      setIsActive(!isActive);
    }
  };

  const handleTogglePlayNormal = () => {
    if (!isActive) {
      playChime(440, 1.2);
    }
    setIsActive(!isActive);
  };

  const handlePauseFullscreen = () => {
    setIsActive(false);
    setIsPauseOverlayOpen(true);
    stopSoundscape();
  };

  const handleResumeFullscreen = () => {
    setIsPauseOverlayOpen(false);
    setIsActive(true);
    playChime(440, 1.0);
  };

  const handleExitFullscreen = () => {
    setIsActive(false);
    setIsFullscreenStudy(false);
    setIsPauseOverlayOpen(false);
    stopSoundscape();

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) {}
  };

  const handleReset = () => {
    setIsActive(false);
    stopSoundscape();
    setSecondsRemaining(
      timerMode === 'focus' ? focusDurationMinutes * 60 : breakDurationMinutes * 60
    );
  };

  const handleSelectPreset = (focusMins: number, breakMins: number) => {
    setIsActive(false);
    stopSoundscape();
    setFocusDurationMinutes(focusMins);
    setBreakDurationMinutes(breakMins);
    setTimerMode('focus');
    setSecondsRemaining(focusMins * 60);
  };

  // Grade card during Pomodoro study session
  const handleGradeCard = async (grade: 1 | 2 | 3 | 4) => {
    if (subjectCards.length === 0) return;
    const currentCard = subjectCards[currentCardIndex];

    try {
      await ApiService.gradeCard(currentCard.id, grade);
      setCardsStudiedThisSession((prev) => prev + 1);
      const earnedXp = grade >= 3 ? 15 : 5;
      const earnedGrowth = grade >= 3 ? 10 : 3;

      onRewardXp(earnedXp);

      // Real-time boost to garden vitality
      handleUpdateGarden((prev) => ({
        ...prev,
        growthPoints: (prev.growthPoints || 0) + earnedGrowth,
        totalXpContributed: (prev.totalXpContributed || 0) + earnedXp,
      }));

      // Move to next card
      if (currentCardIndex + 1 < subjectCards.length) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        // Cycle back
        setCurrentCardIndex(0);
      }
      setIsFlipped(false);
      setShowHint(false);
    } catch (e) {}
  };

  // Formatter for MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Progress percentage for circular ring
  const totalDuration =
    timerMode === 'focus' ? focusDurationMinutes * 60 : breakDurationMinutes * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalDuration - secondsRemaining) / totalDuration) * 100)
  );

  const getTreeStageEmoji = (percent: number) => {
    if (timerMode !== 'focus') return '☕'; // Coffee for break
    if (percent < 10) return '🌱'; // Seedling
    if (percent < 30) return '🌿'; // Sprout
    if (percent < 50) return '🪴'; // Potted Plant
    if (percent < 75) return '🌳'; // Small Tree
    if (percent < 95) return '🌲'; // Pine
    return '✨🌳✨'; // Magical Tree completion
  };

  const activeQuote = GHIBLI_QUOTES[currentQuoteIndex];
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div id="study-pomodoro-page" className="space-y-6 animate-fade-in">
      {/* Sub-Tab Navigation Header (Pomodoro Focus vs. Ghibli Sanctuary Garden) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-[var(--theme-card)] rounded-3xl border border-[var(--theme-border)]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('timer')}
            style={
              activeSubTab === 'timer'
                ? {
                    backgroundColor: 'var(--theme-accent)',
                    color: '#ffffff',
                  }
                : undefined
            }
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'timer'
                ? 'shadow-md'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-700/60'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Pomodoro Focus Session</span>
          </button>

          <button
            onClick={() => setActiveSubTab('garden')}
            style={
              activeSubTab === 'garden'
                ? {
                    backgroundColor: 'var(--theme-accent)',
                    color: '#ffffff',
                  }
                : undefined
            }
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'garden'
                ? 'shadow-md'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-700/60'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Ghibli Forest Sanctuary ({gardenState.plantedTrees.length} Trees)</span>
          </button>
        </div>

        {/* Quick Resource Counters */}
        <div className="flex flex-wrap items-center gap-2.5 px-3 py-1 text-xs font-extrabold text-stone-700 dark:text-stone-300">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{gardenState.growthPoints || 0} GP</span>
          </span>
          <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-800">
            <Droplets className="w-3.5 h-3.5" />
            <span>{gardenState.dewDrops} 💧</span>
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
            <Coins className="w-3.5 h-3.5" />
            <span>{gardenState.forestCoins} 🪙</span>
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--theme-subtle)',
              color: 'var(--theme-accent)',
            }}
          >
            Lv. {gardenState.forestLevel} Sanctuary
          </span>
        </div>
      </div>

      {/* Render Sub-View */}
      {activeSubTab === 'garden' ? (
        <GhibliGardenView
          gardenState={gardenState}
          onUpdateGarden={handleUpdateGarden}
          onNavigateToPomodoro={() => setActiveSubTab('timer')}
        />
      ) : (
        /* Main Pomodoro Study Engine */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Column: Pomodoro Clock & Active Flashcard View */}
          <div className="lg:col-span-8 space-y-6">
            {/* Pomodoro Timer Center Card */}
            <div className="relative overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 sm:p-10 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
              {/* Presets Bar */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handleSelectPreset(25, 5)}
                  style={
                    focusDurationMinutes === 25
                      ? {
                          backgroundColor: 'var(--theme-accent)',
                          color: '#ffffff',
                        }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    focusDurationMinutes === 25
                      ? 'shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  Classic (25 / 5)
                </button>
                <button
                  onClick={() => handleSelectPreset(50, 10)}
                  style={
                    focusDurationMinutes === 50
                      ? {
                          backgroundColor: 'var(--theme-accent)',
                          color: '#ffffff',
                        }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    focusDurationMinutes === 50
                      ? 'shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  Deep Work (50 / 10)
                </button>
                <button
                  onClick={() => handleSelectPreset(15, 3)}
                  style={
                    focusDurationMinutes === 15
                      ? {
                          backgroundColor: 'var(--theme-accent)',
                          color: '#ffffff',
                        }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    focusDurationMinutes === 15
                      ? 'shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  Quick Sprint (15 / 3)
                </button>
              </div>

              {/* Circular Aesthetic Countdown Clock */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                {/* Background Tree Animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full z-0">
                  <motion.div 
                    initial={false}
                    animate={
                      isFocusCompleting 
                        ? { scale: [1, 1.5, 2.5], y: [0, -10, -20], opacity: [0.2, 0.8, 0], rotate: [0, 5, -5, 0] } 
                        : { scale: 0.5 + (progressPercent / 100) * 1.5, y: 10 - (progressPercent / 100) * 10, opacity: timerMode === 'focus' ? 0.2 : 0.15 }
                    }
                    transition={
                      isFocusCompleting 
                        ? { duration: 2.5, ease: "easeOut" }
                        : { duration: 1 }
                    }
                    className="flex items-center justify-center"
                    style={{ fontSize: '6rem' }}
                  >
                    {isFocusCompleting ? '✨🌳✨' : getTreeStageEmoji(progressPercent)}
                  </motion.div>
                </div>

                {/* Background Track */}
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-stone-100 dark:stroke-stone-800"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="transition-all duration-1000 ease-linear"
                    stroke="var(--theme-accent)"
                    strokeWidth="6"
                    strokeDasharray={276.46}
                    strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute flex flex-col items-center justify-center space-y-1">
                  <span
                    className="text-[11px] font-extrabold uppercase tracking-widest"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    {timerMode === 'focus' ? '🌱 Deep Focus' : '☕ Rest & Restore'}
                  </span>

                  <span className="text-4xl sm:text-5xl font-black text-[var(--theme-text)] font-mono tracking-tight">
                    {formatTime(secondsRemaining)}
                  </span>

                  <span className="text-xs text-stone-400 font-medium">
                    {timerMode === 'focus' ? 'Growing trees' : 'Resting minds'}
                  </span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  title="Reset Timer"
                  className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  id="start-studying-button"
                  data-testid="start-studying-btn"
                  onClick={handleStartStudyClick}
                  style={{
                    backgroundColor: isActive ? '#d97706' : 'var(--theme-accent)',
                  }}
                  className="flex items-center gap-2 px-8 py-4 rounded-3xl text-white text-sm font-bold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {isActive ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pause Session</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>
                        {selectedSubjectId !== 'none'
                          ? 'Start Studying (Full Screen)'
                          : 'Start Studying'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSecondsRemaining((prev) => prev + 5 * 60)}
                  title="Add 5 Minutes"
                  className="px-3.5 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 transition-all cursor-pointer"
                >
                  +5m
                </button>
              </div>

              {/* Ghibli Inspirational Quote */}
              <p className="text-xs italic text-stone-400 dark:text-stone-500 max-w-md">
                "{activeQuote.quote}" — <span className="font-semibold">{activeQuote.film}</span>
              </p>
            </div>

            {/* Optional In-Page Flashcards Preview Box (When not in full screen) */}
            {selectedSubjectId !== 'none' && subjectCards.length > 0 && (
              <div className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                    <h3 className="text-sm font-bold text-[var(--theme-text)]">
                      Selected Material: {selectedSubject?.title} ({subjectCards.length} cards)
                    </h3>
                  </div>

                  <button
                    onClick={handleStartStudyClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-accent)' }}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Open Full Screen</span>
                  </button>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Clicking <strong>Start Studying</strong> opens a full-screen, distraction-free study room where you can review cards with active recall and keyboard shortcuts.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Settings, Subject Selector & Soundscapes */}
          <div className="lg:col-span-4 space-y-6">
            {/* Study Subject Picker */}
            <div className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                <h3 className="text-sm font-bold text-[var(--theme-text)]">
                  Study Material
                </h3>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400">
                Select a flashcard deck to study actively in Full Screen mode, or choose "Pure Timer Flow" to run a standard Pomodoro session.
              </p>

              <select
                id="study-material-select"
                data-testid="study-material-select"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-[var(--theme-border)] rounded-xl text-xs font-bold text-[var(--theme-text)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              >
                <option value="none">Pure Timer Flow (No deck - Standard mode)</option>
                {subjects
                  .filter((s) => !s.isDeleted)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      📚 {s.title} ({s.cardCount} cards)
                    </option>
                  ))}
              </select>

              {selectedSubjectId !== 'none' && (
                <div
                  className="p-3 rounded-2xl text-xs flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--theme-subtle)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Full Screen Mode Enabled
                  </span>
                  <span className="text-[10px] font-semibold opacity-80">
                    {subjectCards.length} cards loaded
                  </span>
                </div>
              )}
            </div>

            {/* Ambient Nature Soundscapes */}
            <div className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                  <h3 className="text-sm font-bold text-[var(--theme-text)]">
                    Ambient Soundscapes
                  </h3>
                </div>

                <button
                  onClick={() => setIsSoundMuted(!isSoundMuted)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'meadow_breeze', label: 'Meadow Breeze & Chimes 🎐' },
                  { id: 'rain_leaves', label: 'Rain on Forest Leaves 🌧️' },
                  { id: 'campfire', label: 'Campfire & Hearth Fireplace 🔥' },
                  { id: 'stream', label: 'Mountain Stream 🌊' },
                  { id: 'twilight_crickets', label: 'Twilight Crickets & Spirits 🌌' },
                  { id: 'none', label: 'Silent Focus 🔇' },
                ].map((snd) => {
                  const isSelected = soundscape === snd.id;
                  return (
                    <button
                      key={snd.id}
                      onClick={() => setSoundscape(snd.id as SoundscapeType)}
                      style={
                        isSelected
                          ? {
                              borderColor: 'var(--theme-accent)',
                              backgroundColor: 'var(--theme-subtle)',
                              color: 'var(--theme-accent)',
                            }
                          : undefined
                      }
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'shadow-2xs'
                          : 'border-[var(--theme-border)] bg-stone-50/50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span>{snd.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Sanctuary Garden Mini-Banner */}
            <div
              className="p-5 rounded-3xl border space-y-3"
              style={{
                backgroundColor: 'var(--theme-subtle)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                <h4 className="text-xs font-bold text-[var(--theme-text)]">
                  Your Sanctuary Forest
                </h4>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Completing this session earns <span className="font-bold text-cyan-600">Dew Drops 💧</span> to water trees and <span className="font-bold text-amber-600">Forest Coins 🪙</span> to unlock land.
              </p>
              <button
                onClick={() => setActiveSubTab('garden')}
                className="w-full py-2 px-3 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] hover:opacity-90 text-xs font-bold text-[var(--theme-text)] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Visit Garden</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN STUDY ROOM WINDOW OVERLAY */}
      {isFullscreenStudy && (
        <div
          id="fullscreen-study-room"
          data-testid="fullscreen-study-room"
          className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-8 animate-fade-in"
          style={{
            backgroundColor: 'var(--theme-bg)',
            color: 'var(--theme-text)',
          }}
        >
          {/* Header Bar: Deck info, Timer Pill, Controls, Soundscapes & Exit */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--theme-border)]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: 'var(--theme-accent)' }}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[var(--theme-text)] flex items-center gap-2">
                  <span>{selectedSubject?.title || 'Study Session'}</span>
                  <span
                    className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--theme-subtle)',
                      color: 'var(--theme-accent)',
                    }}
                  >
                    Card {currentCardIndex + 1} / {subjectCards.length}
                  </span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {cardsStudiedThisSession} cards reviewed in this session
                </p>
              </div>
            </div>

            {/* Middle: Live Pomodoro Timer Pill */}
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border shadow-xs"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <span className="text-xl -mr-1 animate-pulse">
                {getTreeStageEmoji(progressPercent)}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping hidden sm:block"
                style={{ backgroundColor: isActive ? 'var(--theme-accent)' : '#f59e0b' }}
              ></span>
              <span className="font-mono text-base sm:text-lg font-black text-[var(--theme-text)]">
                {formatTime(secondsRemaining)}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline"
                style={{ color: 'var(--theme-accent)' }}
              >
                {timerMode === 'focus' ? 'Focus' : 'Break'}
              </span>
            </div>

            {/* Right: Soundscape, Pause & Exit buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                title={isSoundMuted ? 'Unmute Soundscapes' : 'Mute Soundscapes'}
                className="p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] text-stone-600 dark:text-stone-300 hover:opacity-80 transition-all cursor-pointer"
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                id="fullscreen-pause-btn"
                data-testid="fullscreen-pause-btn"
                onClick={handlePauseFullscreen}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">Pause</span>
              </button>

              <button
                id="fullscreen-exit-btn"
                data-testid="fullscreen-exit-btn"
                onClick={handleExitFullscreen}
                title="Exit Full Screen Mode"
                className="p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] text-stone-600 dark:text-stone-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Flashcard Stage */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto my-6 space-y-6">
            {subjectCards.length > 0 ? (
              <div className="w-full space-y-4">
                {/* 3D Interactive Card Flip Container */}
                <div
                  id="fullscreen-study-card"
                  data-testid="fullscreen-study-card"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[260px] sm:min-h-[300px] w-full p-8 sm:p-10 rounded-3xl bg-[var(--theme-card)] border-2 border-[var(--theme-border)] shadow-xl flex flex-col justify-between cursor-pointer hover:border-[var(--theme-accent)] transition-all relative overflow-hidden group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-extrabold uppercase tracking-widest"
                        style={{ color: 'var(--theme-accent)' }}
                      >
                        {isFlipped ? 'Answer (Back)' : 'Question / Prompt (Front)'}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">
                        Spacebar or click to flip
                      </span>
                    </div>

                    <p className="text-xl sm:text-2xl font-black text-[var(--theme-text)] leading-relaxed">
                      {isFlipped
                        ? subjectCards[currentCardIndex].back
                        : subjectCards[currentCardIndex].front}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-400 pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
                    <span>
                      {isFlipped ? 'How well did you recall this?' : 'Click card to reveal answer'}
                    </span>

                    {subjectCards[currentCardIndex].hint && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint(!showHint);
                        }}
                        style={{ color: 'var(--theme-accent)' }}
                        className="font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>{showHint ? subjectCards[currentCardIndex].hint : 'Hint (H)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grade Recall Buttons (1: Again, 2: Hard, 3: Good, 4: Easy) */}
                {isFlipped ? (
                  <div className="grid grid-cols-4 gap-3 pt-2 animate-fade-in">
                    <button
                      id="grade-btn-again"
                      data-testid="grade-again"
                      onClick={() => handleGradeCard(1)}
                      className="py-3.5 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-700 dark:text-red-300 font-black text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    >
                      <span>Again</span>
                      <span className="text-[10px] opacity-70 font-normal">[1] &lt;10m</span>
                    </button>
                    <button
                      id="grade-btn-hard"
                      data-testid="grade-hard"
                      onClick={() => handleGradeCard(2)}
                      className="py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-black text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    >
                      <span>Hard</span>
                      <span className="text-[10px] opacity-70 font-normal">[2] 1d</span>
                    </button>
                    <button
                      id="grade-btn-good"
                      data-testid="grade-good"
                      onClick={() => handleGradeCard(3)}
                      className="py-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-black text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    >
                      <span>Good</span>
                      <span className="text-[10px] opacity-70 font-normal">[3] 3d</span>
                    </button>
                    <button
                      id="grade-btn-easy"
                      data-testid="grade-easy"
                      onClick={() => handleGradeCard(4)}
                      className="py-3.5 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-black text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    >
                      <span>Easy</span>
                      <span className="text-[10px] opacity-70 font-normal">[4] 7d</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center pt-2">
                    <button
                      onClick={() => setIsFlipped(true)}
                      style={{ backgroundColor: 'var(--theme-accent)' }}
                      className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-all cursor-pointer"
                    >
                      Show Answer (Spacebar)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 bg-[var(--theme-card)] rounded-3xl border border-[var(--theme-border)] space-y-4">
                <p className="text-stone-500">No active cards found in this deck.</p>
                <button
                  onClick={handleExitFullscreen}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold"
                >
                  Return to Library
                </button>
              </div>
            )}
          </div>

          {/* Footer Bar: Quote and Sanctuary progress preview */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--theme-border)] text-xs text-stone-400">
            <p className="italic max-w-lg text-center sm:text-left">
              "{activeQuote.quote}" — <span className="font-semibold">{activeQuote.film}</span>
            </p>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
                <Droplets className="w-3.5 h-3.5" />
                <span>{gardenState.dewDrops} Dew Drops</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <Coins className="w-3.5 h-3.5" />
                <span>{gardenState.forestCoins} Coins</span>
              </span>
            </div>
          </div>

          {/* PAUSE OVERLAY IN FULLSCREEN STUDY */}
          {isPauseOverlayOpen && (
            <div
              id="fullscreen-pause-overlay"
              data-testid="fullscreen-pause-overlay"
              className="absolute inset-0 z-60 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            >
              <div className="bg-[var(--theme-card)] rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[var(--theme-border)] text-center space-y-6">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-md"
                  style={{
                    backgroundColor: 'var(--theme-subtle)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  🌿
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[var(--theme-text)]">
                    Session Paused
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Take a deep breath. Your progress and timer are preserved.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-[var(--theme-border)] grid grid-cols-2 gap-3 text-left">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Time Remaining
                    </span>
                    <span className="text-lg font-mono font-bold text-[var(--theme-text)]">
                      {formatTime(secondsRemaining)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Cards Studied
                    </span>
                    <span className="text-lg font-bold text-[var(--theme-text)]">
                      {cardsStudiedThisSession} cards
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    id="resume-study-btn"
                    data-testid="resume-study-btn"
                    onClick={handleResumeFullscreen}
                    style={{ backgroundColor: 'var(--theme-accent)' }}
                    className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume Studying</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPauseOverlayOpen(false);
                      setTimerMode('break');
                      setSecondsRemaining(breakDurationMinutes * 60);
                      setIsActive(true);
                    }}
                    className="w-full py-3 px-4 rounded-2xl border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-text)] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Take a 5m Break</span>
                  </button>

                  <button
                    id="end-session-early-btn"
                    data-testid="end-session-early-btn"
                    onClick={handleExitFullscreen}
                    className="w-full py-2.5 px-4 text-xs font-bold text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Finish & Close Fullscreen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Session Celebration Modal */}
      {completedRewardModal && (
        <div
          className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setCompletedRewardModal(null);
            handleExitFullscreen();
          }}
        >
          <div
            className="bg-[var(--theme-card)] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[var(--theme-border)] text-center space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-md animate-bounce">
              ✨🌱
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">
                Focus Session Complete!
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                You focused for {completedRewardModal.minutes} minutes and studied {completedRewardModal.cardsStudied} cards. Your Sanctuary flourishes!
              </p>
            </div>

            {/* Reward Badges Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-left">
              {/* Reward XP */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800">
                <span className="text-[10px] uppercase font-extrabold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                  XP REWARD
                </span>
                <span className="text-sm font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                  ⭐ +{completedRewardModal.xpEarned} XP
                </span>
              </div>

              {/* Growth Points */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800">
                <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                  GROWTH ENERGY
                </span>
                <span className="text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  🌿 +{completedRewardModal.growthPoints} GP
                </span>
              </div>

              {/* Dew Drops */}
              <div className="p-3 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-800">
                <span className="text-[10px] uppercase font-extrabold text-cyan-600 dark:text-cyan-400 block mb-0.5">
                  DEW DROPS
                </span>
                <span className="text-sm font-black text-cyan-900 dark:text-cyan-200 flex items-center gap-1">
                  💧 +{completedRewardModal.dewDrops} Dew
                </span>
              </div>

              {/* Forest Coins */}
              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800">
                <span className="text-[10px] uppercase font-extrabold text-amber-600 dark:text-amber-400 block mb-0.5">
                  FOREST COINS
                </span>
                <span className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-1">
                  🪙 +{completedRewardModal.coins} Coins
                </span>
              </div>
            </div>

            {/* Special Seed Drop Banner */}
            {completedRewardModal.seedDrop && (
              <div className="p-3.5 rounded-2xl border border-[#5B8C32]/40 bg-[#5B8C32]/10 flex items-center gap-3 text-left">
                <span className="text-3xl">
                  {PLANT_SPECIES_CATALOG[completedRewardModal.seedDrop.species]?.symbol || '🌰'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-[#5B8C32] tracking-wider">
                      Mystic Seed Harvested
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5B8C32] text-white">
                      +{completedRewardModal.seedDrop.count} Seed
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-stone-900 dark:text-stone-100 truncate">
                    {PLANT_SPECIES_CATALOG[completedRewardModal.seedDrop.species]?.name}
                  </h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    Added to your garden seed inventory. Ready for planting!
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  setCompletedRewardModal(null);
                  handleExitFullscreen();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-text)] hover:opacity-80 cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setCompletedRewardModal(null);
                  handleExitFullscreen();
                  setActiveSubTab('garden');
                }}
                style={{ backgroundColor: 'var(--theme-accent)' }}
                className="flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sprout className="w-4 h-4" />
                <span>Visit Garden & Plant</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
