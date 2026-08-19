import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PLANT_SPECIES_CATALOG,
  getRandomSeedDrop,
  getInitialGardenState,
  loadGardenState,
  saveGardenState,
  GHIBLI_QUOTES,
  STAGE_NAMES,
} from '../../utils/gardenData';

describe('Garden Data Utils', () => {
  describe('PLANT_SPECIES_CATALOG', () => {
    it('contains expected default plants', () => {
      expect(PLANT_SPECIES_CATALOG.camphor_tree).toBeDefined();
      expect(PLANT_SPECIES_CATALOG.cherry_blossom).toBeDefined();
      expect(PLANT_SPECIES_CATALOG.camphor_tree.species).toBe('camphor_tree');
    });
  });

  describe('getRandomSeedDrop', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns rarer seeds for >45 focus minutes', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1); 
      expect(getRandomSeedDrop(50).species).toBe('sky_bonsai');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.4);
      expect(getRandomSeedDrop(50).species).toBe('golden_ginkgo');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.6);
      expect(getRandomSeedDrop(50).species).toBe('spirit_lotus');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.8);
      expect(getRandomSeedDrop(50).species).toBe('kodama_mushrooms');
    });

    it('returns mid-tier seeds for >25 focus minutes', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.2); 
      expect(getRandomSeedDrop(30).species).toBe('cherry_blossom');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(getRandomSeedDrop(30).species).toBe('kodama_mushrooms');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(getRandomSeedDrop(30).species).toBe('citrus_grove');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      expect(getRandomSeedDrop(30).species).toBe('camphor_tree');
    });

    it('returns common seeds for low focus minutes', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.4); 
      expect(getRandomSeedDrop(15).species).toBe('wildflower_meadow');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(getRandomSeedDrop(15).species).toBe('citrus_grove');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      expect(getRandomSeedDrop(15).species).toBe('cherry_blossom');
    });
  });

  describe('getInitialGardenState', () => {
    it('creates a 4x4 grid with 4 center unlocked plots', () => {
      const state = getInitialGardenState();
      expect(state.plots.length).toBe(16);
      
      const unlockedCount = state.plots.filter(p => p.isUnlocked).length;
      expect(unlockedCount).toBe(4);
      
      // Center indices are 5, 6, 9, 10
      expect(state.plots[5].isUnlocked).toBe(true);
      expect(state.plots[6].isUnlocked).toBe(true);
      expect(state.plots[9].isUnlocked).toBe(true);
      expect(state.plots[10].isUnlocked).toBe(true);
    });

    it('places a starter tree in plot 5', () => {
      const state = getInitialGardenState();
      expect(state.plots[5].plantId).toBeDefined();
      expect(state.plantedTrees.length).toBe(1);
      expect(state.plantedTrees[0].plotIndex).toBe(5);
      expect(state.plantedTrees[0].species).toBe('camphor_tree');
    });
    
    it('provides starter currency and seeds', () => {
      const state = getInitialGardenState();
      expect(state.forestCoins).toBe(60);
      expect(state.dewDrops).toBe(8);
      expect(state.seedInventory.camphor_tree).toBeGreaterThanOrEqual(1);
    });
  });

  describe('LocalStorage handling', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('loads initial state if storage is empty', () => {
      const state = loadGardenState();
      expect(state.forestCoins).toBe(60); // Default start
    });

    it('loads saved state correctly', () => {
      const customState = getInitialGardenState();
      customState.forestCoins = 999;
      customState.totalFocusMinutes = 1000;
      
      saveGardenState(customState);
      
      const loadedState = loadGardenState();
      expect(loadedState.forestCoins).toBe(999);
      expect(loadedState.totalFocusMinutes).toBe(1000);
    });
    
    it('gracefully handles corrupted JSON in localStorage', () => {
      localStorage.setItem('oopsly_ghibli_garden', '{ invalid json');
      const state = loadGardenState();
      expect(state.forestCoins).toBe(60); // Falls back to default
    });
    
    it('gracefully handles missing legacy fields in localStorage', () => {
      // Simulate an old save state that didn't have growthPoints or totalXpContributed
      const legacyState = getInitialGardenState();
      // @ts-ignore - intentionally removing required fields to test fallback
      delete legacyState.growthPoints;
      // @ts-ignore
      delete legacyState.totalXpContributed;
      // @ts-ignore
      delete legacyState.seedInventory;
      
      localStorage.setItem('oopsly_ghibli_garden', JSON.stringify(legacyState));
      
      const state = loadGardenState();
      expect(state.growthPoints).toBe(100); // Should fallback to 100
      expect(state.totalXpContributed).toBe(0); // Should fallback to 0
      expect(state.seedInventory).toBeDefined(); // Should apply DEFAULT_SEED_INVENTORY
      expect(state.seedInventory.camphor_tree).toBeGreaterThanOrEqual(1);
    });
    
    it('gracefully falls back if saved state lacks valid arrays', () => {
      // Simulate a saved object that has plots but not an array
      const badState = { plots: "not-an-array", plantedTrees: [] };
      localStorage.setItem('oopsly_ghibli_garden', JSON.stringify(badState));
      
      const state = loadGardenState();
      expect(state.forestCoins).toBe(60); // Falls back to initial default
      
      // And the other way around
      const badState2 = { plots: [], plantedTrees: "not-an-array" };
      localStorage.setItem('oopsly_ghibli_garden', JSON.stringify(badState2));
      
      const state2 = loadGardenState();
      expect(state2.forestCoins).toBe(60); // Falls back to initial default
    });
    
    it('gracefully handles localStorage quota exceeded on save', () => {
      // Mock localStorage.setItem to throw an error
      const setItemMock = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      const customState = getInitialGardenState();
      // Should not throw
      expect(() => saveGardenState(customState)).not.toThrow();
      
      setItemMock.mockRestore();
    });
    
    it('gracefully handles localStorage restricted access on load', () => {
      // Mock localStorage.getItem to throw an error
      const getItemMock = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      
      const state = loadGardenState();
      expect(state.forestCoins).toBe(60); // Falls back to default
      
      getItemMock.mockRestore();
    });
  });
  
  describe('Constants', () => {
    it('GHIBLI_QUOTES contains expected quotes', () => {
      expect(GHIBLI_QUOTES.length).toBeGreaterThan(0);
      expect(GHIBLI_QUOTES[0].quote).toBeDefined();
    });
    
    it('STAGE_NAMES maps stages to progress', () => {
      expect(STAGE_NAMES.seed.progressPercent).toBe(15);
      expect(STAGE_NAMES.ancient.progressPercent).toBe(100);
    });
  });
});
