/**
 * Production Integrator Tests
 * Tests for building production integration with terrain bonuses
 */

import { describe, it, expect } from 'vitest';
import { calculateBuildingProduction } from '@/game/engine/production-integrator';
import { getBuildingById } from '@/data/buildings';
import { TerrainType, ResourceType } from '@/data/types';
import type { PlacedBuilding } from '@/stores/game/buildings';

describe('Production Integrator', () => {
  const createTestBuilding = (buildingId: string, x = 0, y = 0): PlacedBuilding => ({
    entityId: 'test-1',
    buildingId,
    playerId: 'player-1' as any,
    coordinates: { x, y },
    level: 1,
    completedAt: 1,
  });

  describe('Basic Production', () => {
    it('should calculate farm production at 100% efficiency', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        6, // Full allocation
        1.0 // No settlement bonus
      );

      expect(result).toBeDefined();
      expect(result?.resourceType).toBe(ResourceType.FOOD);
      expect(result?.amount).toBe(10); // Base production at 100%
    });

    it('should calculate production at 50% efficiency', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        3, // 50% allocation
        1.0
      );

      expect(result?.amount).toBe(5); // 10 * 0.5
    });

    it('should calculate production at 200% efficiency', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        12, // 200% allocation
        1.0
      );

      expect(result?.amount).toBe(20); // 10 * 2.0
    });

    it('should return null for non-production buildings', () => {
      const building = createTestBuilding('tent');
      const buildingDef = getBuildingById('tent')!;

      const result = calculateBuildingProduction(building, buildingDef, 0, 1.0);

      expect(result).toBeNull();
    });
  });

  describe('Terrain Bonuses', () => {
    it('should apply grassland bonus to farm (+20%)', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        6, // 100% efficiency
        1.0, // No settlement bonus
        TerrainType.GRASSLAND
      );

      // 10 base * 1.0 efficiency * 1.2 terrain = 12
      expect(result?.amount).toBe(12);
    });

    it('should apply forest bonus to lumber mill (+20%)', () => {
      const building = createTestBuilding('lumber_mill');
      const buildingDef = getBuildingById('lumber_mill')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        6, // 100% efficiency
        1.0,
        TerrainType.FOREST
      );

      // 8 base * 1.0 efficiency * 1.2 terrain = 9 (floored from 9.6)
      expect(result?.amount).toBe(9);
    });

    it('should not apply terrain bonus on wrong terrain', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        6,
        1.0,
        TerrainType.PLAINS // No bonus on plains
      );

      expect(result?.amount).toBe(10); // No bonus
    });
  });

  describe('Settlement Bonuses', () => {
    it('should apply settlement bonus (village +10%)', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        6,
        1.1 // Village bonus
      );

      expect(result?.amount).toBe(11); // 10 * 1.1
    });

    it('should stack terrain and settlement bonuses', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        6,
        1.1, // Village bonus
        TerrainType.GRASSLAND // Terrain bonus
      );

      // 10 base * 1.0 efficiency * 1.2 terrain * 1.1 settlement = 13 (floored from 13.2)
      expect(result?.amount).toBe(13);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle efficiency, terrain, and settlement bonuses together', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        12, // 200% efficiency
        1.1, // Village bonus
        TerrainType.GRASSLAND // Terrain bonus
      );

      // 10 base * 2.0 efficiency * 1.2 terrain * 1.1 settlement = 26 (floored from 26.4)
      expect(result?.amount).toBe(26);
    });

    it('should handle zero peasant allocation', () => {
      const building = createTestBuilding('farm');
      const buildingDef = getBuildingById('farm')!;

      const result = calculateBuildingProduction(
        building,
        buildingDef,
        0, // No peasants
        1.1,
        TerrainType.GRASSLAND
      );

      expect(result?.amount).toBe(0); // No production without peasants
    });
  });
});
