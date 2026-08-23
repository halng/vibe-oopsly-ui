import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Droplets,
  Sun,
  Coins,
  Lock,
  Plus,
  Sparkles,
  CloudRain,
  Moon,
  Info,
  Layers,
  Heart,
  Award,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Clock,
  BookOpen,
  Map,
} from 'lucide-react';
import { GardenState, LandPlot, PlantedTree, PlantSpecies, PlantStage } from '../types';
import {
  PLANT_SPECIES_CATALOG,
  STAGE_NAMES,
  SpeciesInfo,
  saveGardenState,
  loadGardenState,
  GHIBLI_QUOTES,
  DEFAULT_SEED_INVENTORY,
} from '../utils/gardenData';
import {
  playWaterDropSound,
  playPlantGrowthChime,
  playChime,
} from '../utils/soundscapes';

interface GhibliGardenViewProps {
  gardenState: GardenState;
  onUpdateGarden: (updater: (prev: GardenState) => GardenState) => void;
  onNavigateToPomodoro: () => void;
}

const JOURNEY_MILESTONES = [
  { level: 1, title: 'The First Sprout', desc: 'You planted your first intention and began your focus journey.', icon: '🌱' },
  { level: 3, title: 'Whispering Woods', desc: 'The forest begins to hum with life as your consistency grows.', icon: '🌿' },
  { level: 7, title: 'Spirit Grove', desc: 'Friendly forest spirits are drawn to the peaceful energy of your focus.', icon: '🦊' },
  { level: 12, title: 'The Great Canopy', desc: 'Your trees provide shade and shelter for wandering travelers.', icon: '🌳' },
  { level: 20, title: 'Ancient Sanctuary', desc: 'A legendary forest, rich with deep magic, ancient roots, and wisdom.', icon: '✨🌲' },
];

export const GhibliGardenView: React.FC<GhibliGardenViewProps> = ({
  gardenState,
  onUpdateGarden,
  onNavigateToPomodoro,
}) => {
  const [selectedPlotIndex, setSelectedPlotIndex] = useState<number | null>(null);
  const [isNurseryOpen, setIsNurseryOpen] = useState(false);
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);
  const [targetPlotForPlanting, setTargetPlotForPlanting] = useState<number | null>(null);
  const [inspectingTree, setInspectingTree] = useState<PlantedTree | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Random peaceful quote
  const [randomQuote] = useState(() => {
    const idx = Math.floor(Math.random() * GHIBLI_QUOTES.length);
    return GHIBLI_QUOTES[idx];
  });

  const toastTimeoutRef = React.useRef<any>(null);
  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleWaterTree = (treeId: string, plotIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (gardenState.dewDrops < 1) {
      showToast('Need Dew Drops! Complete a Pomodoro study session to earn dew.');
      return;
    }

    const currentTree = gardenState.plantedTrees.find((t) => t.id === treeId);
    if (!currentTree) return;

    const speciesInfo = PLANT_SPECIES_CATALOG[currentTree.species];
    const watersNeeded = speciesInfo.watersNeededPerStage;
    const nextProgress = currentTree.growthProgress + Math.round(100 / watersNeeded);
    const willLevelUp = nextProgress >= 100 && currentTree.stage !== 'ancient';

    playWaterDropSound();

    onUpdateGarden((prev) => {
      const updatedTrees = prev.plantedTrees.map((tree) => {
        if (tree.id !== treeId) return tree;

        const spInfo = PLANT_SPECIES_CATALOG[tree.species];
        const wNeeded = spInfo.watersNeededPerStage;
        const newTotalWaters = tree.totalWaters + 1;
        const nProgress = tree.growthProgress + Math.round(100 / wNeeded);

        let nextStage: PlantStage = tree.stage;
        let finalProgress = nProgress;

        if (nProgress >= 100) {
          if (tree.stage === 'seed') nextStage = 'sprout';
          else if (tree.stage === 'sprout') nextStage = 'sapling';
          else if (tree.stage === 'sapling') nextStage = 'blooming';
          else if (tree.stage === 'blooming') nextStage = 'ancient';

          finalProgress = nextStage === 'ancient' ? 100 : 0;
        }

        return {
          ...tree,
          stage: nextStage,
          growthProgress: finalProgress,
          totalWaters: newTotalWaters,
          waterLevel: 100,
          lastWateredAt: new Date().toISOString(),
        };
      });

      return {
        ...prev,
        dewDrops: Math.max(0, prev.dewDrops - 1),
        plantedTrees: updatedTrees,
      };
    });

    if (willLevelUp) {
      setTimeout(() => playPlantGrowthChime(), 150);
      showToast('Your tree grew to a new stage! Forest vitality increased.');
    } else {
      showToast('Watered tree with fresh dew drops!');
    }
  };

  // Supercharge tree using Growth Points gained from XP & Study Sessions
  const handleSuperchargeTree = (treeId: string, plotIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const SUPERCHARGE_COST = 40;

    if ((gardenState.growthPoints || 0) < SUPERCHARGE_COST) {
      showToast(`Need ${SUPERCHARGE_COST} Growth Points! Study flashcards to earn more GP.`);
      return;
    }

    const currentTree = gardenState.plantedTrees.find((t) => t.id === treeId);
    if (!currentTree) return;

    const nextProgress = currentTree.growthProgress + 35;
    const willLevelUp = nextProgress >= 100 && currentTree.stage !== 'ancient';

    playPlantGrowthChime();

    onUpdateGarden((prev) => {
      const updatedTrees = prev.plantedTrees.map((tree) => {
        if (tree.id !== treeId) return tree;

        const nProgress = tree.growthProgress + 35;
        let nextStage: PlantStage = tree.stage;
        let finalProgress = nProgress;

        if (nProgress >= 100) {
          if (tree.stage === 'seed') nextStage = 'sprout';
          else if (tree.stage === 'sprout') nextStage = 'sapling';
          else if (tree.stage === 'sapling') nextStage = 'blooming';
          else if (tree.stage === 'blooming') nextStage = 'ancient';

          finalProgress = nextStage === 'ancient' ? 100 : 0;
        }

        return {
          ...tree,
          stage: nextStage,
          growthProgress: finalProgress,
          waterLevel: 100,
          lastWateredAt: new Date().toISOString(),
        };
      });

      return {
        ...prev,
        growthPoints: Math.max(0, (prev.growthPoints || 0) - SUPERCHARGE_COST),
        plantedTrees: updatedTrees,
      };
    });

    if (willLevelUp) {
      showToast('✨ Supercharged! Tree evolved into a flourishing new stage!');
    } else {
      showToast('🌿 Supercharged with 40 Growth Points (+35% Growth surge)!');
    }
  };

  const handleUnlockPlot = (plotIndex: number) => {
    const plot = gardenState.plots.find((p) => p.index === plotIndex);
    if (!plot) return;

    if (gardenState.forestCoins < plot.unlockCost) {
      showToast(`Need ${plot.unlockCost} Forest Coins! Study to earn more coins.`);
      return;
    }

    playChime(659.25, 1.5);

    onUpdateGarden((prev) => {
      const updatedPlots = prev.plots.map((p) =>
        p.index === plotIndex ? { ...p, isUnlocked: true } : p
      );
      return {
        ...prev,
        forestCoins: prev.forestCoins - plot.unlockCost,
        plots: updatedPlots,
      };
    });

    showToast('New plot of fertile meadow land cleared and ready for planting!');
  };

  const handlePlantSeed = (species: PlantSpecies, useInventorySeed = false) => {
    if (targetPlotForPlanting === null) return;
    const speciesInfo = PLANT_SPECIES_CATALOG[species];
    const userOwnedCount = gardenState.seedInventory?.[species] || 0;

    if (useInventorySeed || userOwnedCount > 0) {
      playPlantGrowthChime();

      const newTreeId = `tree_${Date.now()}_${species}`;
      const newTree: PlantedTree = {
        id: newTreeId,
        plotIndex: targetPlotForPlanting,
        species,
        stage: 'seed',
        waterLevel: 60,
        growthProgress: 0,
        plantedAt: new Date().toISOString(),
        totalWaters: 0,
        nickname: speciesInfo.name,
      };

      onUpdateGarden((prev) => {
        const updatedPlots = prev.plots.map((p) =>
          p.index === targetPlotForPlanting ? { ...p, plantId: newTreeId } : p
        );
        const nextInventory = { ...(prev.seedInventory || DEFAULT_SEED_INVENTORY) };
        if (nextInventory[species] > 0) {
          nextInventory[species] -= 1;
        }

        return {
          ...prev,
          seedInventory: nextInventory,
          plantedTrees: [...prev.plantedTrees, newTree],
          plots: updatedPlots,
        };
      });

      setIsNurseryOpen(false);
      setTargetPlotForPlanting(null);
      showToast(`Planted your harvested ${speciesInfo.name} seed in fertile soil!`);
      return;
    }

    // Purchase with forest coins if no owned seed
    if (gardenState.forestCoins < speciesInfo.seedCost) {
      showToast(`Need ${speciesInfo.seedCost} Forest Coins for this seed.`);
      return;
    }

    playPlantGrowthChime();

    const newTreeId = `tree_${Date.now()}_${species}`;
    const newTree: PlantedTree = {
      id: newTreeId,
      plotIndex: targetPlotForPlanting,
      species,
      stage: 'seed',
      waterLevel: 60,
      growthProgress: 0,
      plantedAt: new Date().toISOString(),
      totalWaters: 0,
      nickname: speciesInfo.name,
    };

    onUpdateGarden((prev) => {
      const updatedPlots = prev.plots.map((p) =>
        p.index === targetPlotForPlanting ? { ...p, plantId: newTreeId } : p
      );
      return {
        ...prev,
        forestCoins: prev.forestCoins - speciesInfo.seedCost,
        plantedTrees: [...prev.plantedTrees, newTree],
        plots: updatedPlots,
      };
    });

    setIsNurseryOpen(false);
    setTargetPlotForPlanting(null);
    showToast(`Purchased and planted a ${speciesInfo.name} seed!`);
  };

  const handleSetWeather = (weather: 'sunny' | 'rain' | 'twilight') => {
    onUpdateGarden((prev) => ({ ...prev, activeWeather: weather }));
  };

  // Weather background visual classes
  const weatherClass =
    gardenState.activeWeather === 'sunny'
      ? 'bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent'
      : gardenState.activeWeather === 'rain'
      ? 'bg-gradient-to-b from-cyan-900/20 via-blue-900/10 to-transparent'
      : 'bg-gradient-to-b from-indigo-950/40 via-purple-950/20 to-transparent';

  return (
    <div id="ghibli-garden-view" className="space-y-6 animate-fade-in">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/90 dark:bg-stone-100/90 text-white dark:text-stone-900 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Ghibli Forest Sanctuary Banner */}
      <div className={`relative overflow-hidden rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 transition-all ${weatherClass} bg-white dark:bg-stone-900/90 shadow-sm`}>
        {/* Ambient floating spirit dust / Kodama background orbs */}
        <div className="absolute -right-6 -top-6 w-48 h-48 bg-[#5B8C32]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B8C32]/15 text-[#5B8C32] dark:text-[var(--theme-accent)] text-xs font-black uppercase tracking-wider">
              <Sprout className="w-4 h-4" />
              <span>Forest Sanctuary · Pomodoro Garden</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Grow Your Studio Ghibli Forest
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Every Pomodoro study session nurtures real trees. Earn Dew Drops to water seedlings,
              collect Forest Coins to clear wild lands, and summon friendly forest spirits.
            </p>
            <p className="text-xs italic text-stone-400 dark:text-stone-500 pt-1">
              "{randomQuote.quote}" — {randomQuote.speaker}, {randomQuote.film}
            </p>
          </div>

          {/* Quick Action: Start Study Session Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onNavigateToPomodoro}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#5B8C32] hover:bg-[#4E7A2A] text-white text-xs font-bold shadow-lg shadow-[#5B8C32]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Start Study Session</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsJourneyOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/80 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-xs transition-colors cursor-pointer"
            >
              <Map className="w-4 h-4 text-amber-500" />
              <span>Forest Journey</span>
            </button>

            <button
              onClick={() => {
                setTargetPlotForPlanting(null);
                setIsNurseryOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/80 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#5B8C32]" />
              <span>Tree Nursery</span>
            </button>
          </div>
        </div>

        {/* Resources & Weather Status Bar */}
        <div className="mt-6 pt-5 border-t border-stone-200/60 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {/* Growth Energy Points */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-stone-400 block tracking-wider">
                  Growth Energy
                </span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                  {gardenState.growthPoints || 0} GP 🌿
                </span>
              </div>
            </div>

            {/* Dew Drops */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-stone-400 block tracking-wider">
                  Dew Drops (Water)
                </span>
                <span className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {gardenState.dewDrops} 💧
                </span>
              </div>
            </div>

            {/* Sunlight / Focus Minutes */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-stone-400 block tracking-wider">
                  Study Focus
                </span>
                <span className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {gardenState.totalFocusMinutes} mins
                </span>
              </div>
            </div>

            {/* Forest Coins */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-stone-400 block tracking-wider">
                  Forest Coins
                </span>
                <span className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {gardenState.forestCoins} 🪙
                </span>
              </div>
            </div>
          </div>

          {/* Weather Mood Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl border border-stone-200/60 dark:border-stone-700">
            <button
              onClick={() => handleSetWeather('sunny')}
              title="Sunny Meadow Afternoon"
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gardenState.activeWeather === 'sunny'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSetWeather('rain')}
              title="Forest Rain Shower"
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gardenState.activeWeather === 'rain'
                  ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <CloudRain className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSetWeather('twilight')}
              title="Spirit Twilight with Fireflies"
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gardenState.activeWeather === 'twilight'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 4x4 Garden Meadow Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Meadow Land Plots ({gardenState.plots.filter((p) => p.isUnlocked).length} / 16 Unlocked)
            </span>
          </div>

          <span className="text-xs text-stone-500 dark:text-stone-400">
            Click empty plots to plant · Click trees to water with dew drops
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {gardenState.plots.map((plot) => {
            const plantedTree = gardenState.plantedTrees.find((t) => t.plotIndex === plot.index);
            const speciesInfo = plantedTree ? PLANT_SPECIES_CATALOG[plantedTree.species] : null;

            if (!plot.isUnlocked) {
              return (
                /* Locked Wild Plot */
                <button
                  key={plot.index}
                  onClick={() => handleUnlockPlot(plot.index)}
                  className="group relative h-40 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700/80 bg-stone-100/60 dark:bg-stone-800/40 p-4 flex flex-col items-center justify-center text-center hover:border-amber-500/80 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-stone-200 dark:bg-stone-700 text-stone-500 group-hover:text-amber-600 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 flex items-center justify-center mb-2 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Wild Plot
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-extrabold mt-1">
                    Unlock: {plot.unlockCost} 🪙
                  </span>
                </button>
              );
            }

            if (!plantedTree || !speciesInfo) {
              return (
                /* Empty Fertile Soil Plot */
                <button
                  key={plot.index}
                  onClick={() => {
                    setTargetPlotForPlanting(plot.index);
                    setIsNurseryOpen(true);
                  }}
                  className="group relative h-40 rounded-3xl border-2 border-dashed border-[#5B8C32]/30 dark:border-[#5B8C32]/40 bg-[#FAF8F0] dark:bg-stone-800/60 p-4 flex flex-col items-center justify-center text-center hover:border-[#5B8C32] hover:bg-[#5B8C32]/5 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#5B8C32]/15 text-[#5B8C32] group-hover:scale-110 flex items-center justify-center mb-2 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Fertile Soil
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium mt-0.5">
                    Click to plant seed
                  </span>
                </button>
              );
            }

            /* Planted Living Tree Plot */
            const stageLabel = STAGE_NAMES[plantedTree.stage].label;
            const isAncientOrBlooming =
              plantedTree.stage === 'ancient' || plantedTree.stage === 'blooming';

            return (
              <div
                key={plot.index}
                onClick={() => setInspectingTree(plantedTree)}
                className="group relative h-40 rounded-3xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-3.5 flex flex-col justify-between hover:shadow-md hover:border-[#5B8C32] transition-all cursor-pointer overflow-hidden"
              >
                {/* Visual aura for blooming / ancient spirit trees */}
                {isAncientOrBlooming && (
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none rounded-3xl"
                    style={{ backgroundColor: speciesInfo.accentColor }}
                  />
                )}

                {/* Top: Species badge & stage */}
                <div className="flex items-start justify-between gap-1 z-10">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: speciesInfo.accentColor }}
                  >
                    {plantedTree.stage.toUpperCase()}
                  </span>

                  <button
                    onClick={(e) => handleWaterTree(plantedTree.id, plot.index, e)}
                    title="Water with Dew Drops"
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 text-[11px] font-extrabold border border-cyan-200 dark:border-cyan-800 cursor-pointer"
                  >
                    <Droplets className="w-3 h-3 text-cyan-600" />
                    <span>Water</span>
                  </button>
                </div>

                {/* Center: Animated Plant Avatar & Emoji */}
                <div className="flex flex-col items-center justify-center my-auto z-10">
                  <span className="text-3xl sm:text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {speciesInfo.symbol}
                  </span>
                  <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100 truncate max-w-[120px] text-center mt-1">
                    {speciesInfo.name}
                  </h4>
                </div>

                {/* Bottom: Growth bar & waters */}
                <div className="space-y-1 z-10">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 dark:text-stone-400">
                    <span>Growth</span>
                    <span>{plantedTree.growthProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, plantedTree.growthProgress)}%`,
                        backgroundColor: speciesInfo.accentColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nursery / Seed Shop Modal */}
      {isNurseryOpen && (
        <div
          className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setIsNurseryOpen(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200/80 dark:border-stone-800 space-y-5 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#5B8C32]/15 text-[#5B8C32] flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    Studio Ghibli Seed Nursery
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {targetPlotForPlanting !== null
                      ? `Select a seed to plant in Plot #${targetPlotForPlanting + 1}`
                      : 'Browse mystical trees and flora to plant in your sanctuary'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>{gardenState.forestCoins} Coins Available</span>
              </div>
            </div>

            {/* Seeds Catalog Grid */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* User's Harvested Seeds Inventory Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌰</span>
                    <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      Your Harvested Seed Inventory
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    Earned from Study Sessions & XP
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(gardenState.seedInventory || {}).filter(([_, count]) => count > 0).length === 0 ? (
                    <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                      No seeds in inventory right now. Complete Pomodoro study sessions to harvest rare mystical seeds!
                    </p>
                  ) : (
                    Object.entries(gardenState.seedInventory || {}).map(([spKey, count]) => {
                      if (count <= 0) return null;
                      const sp = PLANT_SPECIES_CATALOG[spKey as PlantSpecies];
                      if (!sp) return null;

                      return (
                        <div
                          key={spKey}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-emerald-300 dark:border-emerald-700 shadow-2xs text-xs"
                        >
                          <span className="text-base">{sp.symbol}</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">{sp.name}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">
                            {count}x Owned
                          </span>
                          {targetPlotForPlanting !== null && (
                            <button
                              onClick={() => handlePlantSeed(sp.species, true)}
                              className="ml-1 px-2 py-0.5 rounded-lg bg-[#5B8C32] hover:bg-[#4E7A2A] text-white text-[10px] font-bold cursor-pointer"
                            >
                              Plant Free
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Full Species Catalog Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {Object.values(PLANT_SPECIES_CATALOG).map((sp) => {
                  const ownedCount = gardenState.seedInventory?.[sp.species] || 0;
                  const canAfford = gardenState.forestCoins >= sp.seedCost;

                  return (
                    <div
                      key={sp.species}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{sp.symbol}</span>
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-[#5B8C32] block">
                                {sp.filmLore} · {sp.jpName}
                              </span>
                              <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                                {sp.name}
                              </h3>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                              style={{ backgroundColor: sp.accentColor }}
                            >
                              {sp.rarity}
                            </span>
                            {ownedCount > 0 && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                {ownedCount} in Bag 🌰
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                          {sp.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>{sp.seedCost} Coins</span>
                        </span>

                        {targetPlotForPlanting !== null ? (
                          <div className="flex items-center gap-2">
                            {ownedCount > 0 ? (
                              <button
                                onClick={() => handlePlantSeed(sp.species, true)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#5B8C32] hover:bg-[#4E7A2A] text-white text-xs font-bold shadow-xs cursor-pointer"
                              >
                                Plant Free ({ownedCount})
                              </button>
                            ) : (
                              <button
                                disabled={!canAfford}
                                onClick={() => handlePlantSeed(sp.species, false)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs disabled:opacity-40 cursor-pointer"
                              >
                                Buy & Plant
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-stone-400">
                            Select empty plot to plant
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end shrink-0">
              <button
                onClick={() => setIsNurseryOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-200 cursor-pointer"
              >
                Close Nursery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Tree Modal */}
      {inspectingTree && (
        <div
          className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setInspectingTree(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200/80 dark:border-stone-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const sp = PLANT_SPECIES_CATALOG[inspectingTree.species];
              const hasEnoughGp = (gardenState.growthPoints || 0) >= 40;

              return (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{sp.symbol}</span>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#5B8C32] block">
                          {sp.filmLore} · {sp.jpName}
                        </span>
                        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                          {sp.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: sp.accentColor }}
                    >
                      {inspectingTree.stage.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/50 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
                    {sp.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700">
                      <span className="text-[10px] text-stone-400 block font-bold">STAGE</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {STAGE_NAMES[inspectingTree.stage].label}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700">
                      <span className="text-[10px] text-stone-400 block font-bold">TOTAL WATERS</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {inspectingTree.totalWaters} times 💧
                      </span>
                    </div>
                  </div>

                  {/* Growth Surge Action */}
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                        Growth Energy Available
                      </span>
                      <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                        {gardenState.growthPoints || 0} GP 🌿
                      </span>
                    </div>

                    <button
                      disabled={!hasEnoughGp}
                      onClick={() => {
                        handleSuperchargeTree(inspectingTree.id, inspectingTree.plotIndex);
                        setInspectingTree(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#5B8C32] hover:bg-[#4E7A2A] text-white text-xs font-bold shadow-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Supercharge (+35% Growth / 40 GP)</span>
                    </button>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setInspectingTree(null)}
                      className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                    >
                      Done
                    </button>

                    <button
                      onClick={() => {
                        handleWaterTree(inspectingTree.id, inspectingTree.plotIndex);
                        setInspectingTree(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Droplets className="w-4 h-4" />
                      <span>Water Tree (1 Dew)</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* Forest Journey Modal */}
      {isJourneyOpen && (
        <div
          className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setIsJourneyOpen(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200/80 dark:border-stone-800 space-y-5 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    Your Forest Journey
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Current Level: {gardenState.forestLevel || 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 relative">
              {/* Vertical line behind */}
              <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-stone-100 dark:bg-stone-800 rounded-full" />
              
              {JOURNEY_MILESTONES.map((milestone, idx) => {
                const isUnlocked = (gardenState.forestLevel || 1) >= milestone.level;
                const isNext = !isUnlocked && (idx === 0 || (gardenState.forestLevel || 1) >= JOURNEY_MILESTONES[idx - 1].level);
                
                return (
                  <div key={milestone.level} className={`flex gap-4 relative z-10 transition-all ${isUnlocked ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-xs border-2 ${isUnlocked ? 'bg-white dark:bg-stone-800 border-[#5B8C32]' : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700'}`}>
                        {milestone.icon}
                      </div>
                    </div>
                    <div className="pb-6 pt-1">
                      <span className={`text-[10px] uppercase font-black tracking-wider ${isUnlocked ? 'text-[#5B8C32]' : 'text-stone-400'}`}>
                        Level {milestone.level}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                        {milestone.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                        {isUnlocked ? milestone.desc : isNext ? 'Keep studying to unlock this milestone.' : 'Locked milestone.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end shrink-0">
              <button
                onClick={() => setIsJourneyOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-200 cursor-pointer"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
