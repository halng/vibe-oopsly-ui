import { describe, it, expect } from 'vitest';
import {
  clampDifficulty,
  initDifficulty,
  nextDifficulty,
  retrievability,
  recallStability,
  forgetStability,
  scheduleCard,
  formatInterval,
} from '../../utils/fsrs';
import { CardState, Grade } from '../../types';

describe('FSRS Algorithm Utils', () => {
  describe('clampDifficulty', () => {
    it('clamps values below 1 to 1', () => {
      expect(clampDifficulty(0)).toBe(1.0);
      expect(clampDifficulty(-5)).toBe(1.0);
    });

    it('clamps values above 10 to 10', () => {
      expect(clampDifficulty(11)).toBe(10.0);
      expect(clampDifficulty(100)).toBe(10.0);
    });

    it('returns values within bounds as is', () => {
      expect(clampDifficulty(5)).toBe(5.0);
      expect(clampDifficulty(1.0)).toBe(1.0);
      expect(clampDifficulty(10.0)).toBe(10.0);
    });
  });

  describe('initDifficulty', () => {
    it('calculates initial difficulty based on grade', () => {
      expect(initDifficulty(1)).toBeGreaterThan(1);
      expect(initDifficulty(4)).toBeLessThan(10);
    });
  });

  describe('nextDifficulty', () => {
    it('calculates next difficulty correctly', () => {
      expect(nextDifficulty(5, 1)).toBeGreaterThan(5); // Again increases difficulty
      expect(nextDifficulty(5, 4)).toBeLessThan(5); // Easy decreases difficulty
    });
  });

  describe('retrievability', () => {
    it('calculates retrievability correctly', () => {
      expect(retrievability(1, 1)).toBeLessThan(1);
      expect(retrievability(0, 1)).toBe(1);
    });
  });

  describe('recallStability and forgetStability', () => {
    it('recallStability increases stability', () => {
      const currentS = 2;
      const nextS = recallStability(5, currentS, 0.9, 3);
      expect(nextS).toBeGreaterThan(currentS);
    });

    it('recallStability applies hard and easy modifiers', () => {
      const s3 = recallStability(5, 2, 0.9, 3);
      const s2 = recallStability(5, 2, 0.9, 2);
      const s4 = recallStability(5, 2, 0.9, 4);
      // Based on W[15] = 1.1695 and W[16] = 2.4
      expect(s2).toBeGreaterThan(s3);
      expect(s4).toBeGreaterThan(s3);
    });

    it('forgetStability returns a valid stability', () => {
      const newS = forgetStability(5, 2, 0.9);
      expect(newS).toBeGreaterThan(0);
    });
  });

  describe('scheduleCard', () => {
    const newCard: CardState = {
      stability: 0,
      difficulty: 0,
      intervalDays: 0,
      repetitions: 0,
    };

    it('schedules a new card correctly for grade 1 (Again)', () => {
      const result = scheduleCard(newCard, 1);
      expect(result.repetitions).toBe(0);
      expect(result.intervalDays).toBe(0);
      // Due date should be in ~10 minutes
      const now = Date.now();
      const due = new Date(result.dueDate).getTime();
      expect(due - now).toBeGreaterThan(9 * 60 * 1000);
      expect(due - now).toBeLessThan(11 * 60 * 1000);
    });

    it('schedules a new card correctly for grade 4 (Easy)', () => {
      const result = scheduleCard(newCard, 4);
      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBeGreaterThan(0);
    });

    it('schedules an existing card for grade 1 (Again)', () => {
      const existingCard: CardState = {
        stability: 5,
        difficulty: 5,
        intervalDays: 5,
        repetitions: 2,
      };
      const result = scheduleCard(existingCard, 1);
      expect(result.repetitions).toBe(0); // Reset
      expect(result.intervalDays).toBe(0);
      
      const now = Date.now();
      const due = new Date(result.dueDate).getTime();
      expect(due - now).toBeGreaterThan(9 * 60 * 1000);
      expect(due - now).toBeLessThan(11 * 60 * 1000);
    });

    it('schedules an existing card for grade 3 (Good)', () => {
      const existingCard: CardState = {
        stability: 5,
        difficulty: 5,
        intervalDays: 5,
        repetitions: 2,
      };
      const result = scheduleCard(existingCard, 3);
      expect(result.repetitions).toBe(3);
      expect(result.intervalDays).toBeGreaterThan(existingCard.intervalDays);
    });
    
    it('schedules a new card correctly for grade 2 (Hard) and 3 (Good)', () => {
      const result2 = scheduleCard(newCard, 2);
      expect(result2.intervalDays).toBeGreaterThan(0);
      
      const result3 = scheduleCard(newCard, 3);
      expect(result3.intervalDays).toBeGreaterThan(0);
    });
  });

  describe('formatInterval', () => {
    it('formats intervals correctly', () => {
      expect(formatInterval(0)).toBe('< 10m');
      expect(formatInterval(1)).toBe('1d');
      expect(formatInterval(15)).toBe('15d');
      expect(formatInterval(30)).toBe('1mo');
      expect(formatInterval(45)).toBe('2mo');
      expect(formatInterval(365)).toBe('1.0y');
      expect(formatInterval(730)).toBe('2.0y');
    });
  });
});
