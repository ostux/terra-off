/**
 * Production Calculator Tests
 * Tests for production efficiency calculations and resource generation
 */

import { describe, it, expect } from 'vitest';
import { calculatePeasantEfficiency } from '@/data/config';

describe('Production Calculator', () => {
  describe('Peasant Efficiency Calculation', () => {
    it('should return 0% efficiency with 0 peasants', () => {
      const efficiency = calculatePeasantEfficiency(0, 6);
      expect(efficiency).toBe(0);
    });

    it('should return 0% efficiency below 50% threshold (2 of 6)', () => {
      const efficiency = calculatePeasantEfficiency(2, 6);
      expect(efficiency).toBe(0);
    });

    it('should return 50% efficiency at 50% allocation (3 of 6)', () => {
      const efficiency = calculatePeasantEfficiency(3, 6);
      expect(efficiency).toBe(0.5);
    });

    it('should return 100% efficiency at full allocation (6 of 6)', () => {
      const efficiency = calculatePeasantEfficiency(6, 6);
      expect(efficiency).toBe(1.0);
    });

    it('should return 200% efficiency at double allocation (12 of 6)', () => {
      const efficiency = calculatePeasantEfficiency(12, 6);
      expect(efficiency).toBe(2.0);
    });

    it('should cap at 500% efficiency (30 of 6)', () => {
      const efficiency = calculatePeasantEfficiency(30, 6);
      expect(efficiency).toBe(5.0);
    });

    it('should cap at 500% efficiency even with more peasants (36 of 6)', () => {
      const efficiency = calculatePeasantEfficiency(36, 6);
      expect(efficiency).toBe(5.0);
    });
  });

  describe('Production Calculation', () => {
    it('should calculate production with efficiency', () => {
      const baseProduction = 10;
      const efficiency = 0.5;
      const production = Math.floor(baseProduction * efficiency);
      expect(production).toBe(5);
    });

    it('should floor fractional production', () => {
      const baseProduction = 10;
      const efficiency = 0.55;
      const production = Math.floor(baseProduction * efficiency);
      expect(production).toBe(5); // 5.5 floored
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate farm production correctly', () => {
      const farmBaseProduction = 10;
      const requiredPeasants = 6;

      // No peasants
      let efficiency = calculatePeasantEfficiency(0, requiredPeasants);
      let production = Math.floor(farmBaseProduction * efficiency);
      expect(production).toBe(0);

      // 3 peasants (50%)
      efficiency = calculatePeasantEfficiency(3, requiredPeasants);
      production = Math.floor(farmBaseProduction * efficiency);
      expect(production).toBe(5);

      // 6 peasants (100% - optimal)
      efficiency = calculatePeasantEfficiency(6, requiredPeasants);
      production = Math.floor(farmBaseProduction * efficiency);
      expect(production).toBe(10);

      // 12 peasants (200%)
      efficiency = calculatePeasantEfficiency(12, requiredPeasants);
      production = Math.floor(farmBaseProduction * efficiency);
      expect(production).toBe(20);

      // 30 peasants (500% - max)
      efficiency = calculatePeasantEfficiency(30, requiredPeasants);
      production = Math.floor(farmBaseProduction * efficiency);
      expect(production).toBe(50);
    });

    it('should handle lumber mill production', () => {
      const lumberMillBase = 8;
      const requiredPeasants = 6;

      const efficiency = calculatePeasantEfficiency(6, requiredPeasants);
      const production = Math.floor(lumberMillBase * efficiency);
      expect(production).toBe(8);
    });
  });
});
