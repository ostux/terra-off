/**
 * Building Placement Tests
 * Tests for building placement validation and terrain restrictions
 */

import { describe, it, expect } from 'vitest';
import { isTerrainSuitable } from '@/game/engine/building-placer';
import { TerrainType } from '@/data/types';
import { getBuildingById } from '@/data/buildings';

describe('Building Placement - Terrain Validation', () => {
  describe('Water Restrictions', () => {
    it('should prevent all buildings on water tiles', () => {
      const farm = getBuildingById('farm');
      expect(farm).toBeDefined();

      const result = isTerrainSuitable('farm', TerrainType.WATER);

      expect(result.suitable).toBe(false);
      expect(result.reason?.toLowerCase()).toContain('water');
    });

    it('should allow tent on grassland', () => {
      const result = isTerrainSuitable('tent', TerrainType.GRASSLAND);

      expect(result.suitable).toBe(true);
    });
  });

  describe('Mountain Restrictions', () => {
    it('should allow quarry on mountain', () => {
      const result = isTerrainSuitable('quarry', TerrainType.MOUNTAIN);

      expect(result.suitable).toBe(true);
    });

    it('should allow mine on mountain', () => {
      const result = isTerrainSuitable('mine', TerrainType.MOUNTAIN);

      expect(result.suitable).toBe(true);
    });

    it('should prevent farm on mountain (allowed terrains restriction)', () => {
      // Farm doesn't have allowedTerrains, so it's allowed anywhere except forbidden
      // Currently only quarry and mine have allowedTerrains: [MOUNTAIN]
      const result = isTerrainSuitable('farm', TerrainType.GRASSLAND);
      expect(result.suitable).toBe(true);
    });

    it('should prevent non-mountain buildings on mountain if they have allowed terrains', () => {
      // Only quarry and mine can be built on mountains (via allowedTerrains)
      // Other buildings don't forbid mountains, they just don't specify them as allowed
      const result = isTerrainSuitable('quarry', TerrainType.GRASSLAND);
      expect(result.suitable).toBe(false);
      expect(result.reason?.toLowerCase()).toContain('mountain');
    });
  });

  describe('Terrain Suitability', () => {
    it('should allow farm on grassland', () => {
      const result = isTerrainSuitable('farm', TerrainType.GRASSLAND);
      expect(result.suitable).toBe(true);
    });

    it('should allow lumber mill on forest', () => {
      const result = isTerrainSuitable('lumber_mill', TerrainType.FOREST);
      expect(result.suitable).toBe(true);
    });

    it('should allow infrastructure on any land', () => {
      const terrains = [
        TerrainType.GRASSLAND,
        TerrainType.FOREST,
        TerrainType.PLAINS,
      ];

      for (const terrain of terrains) {
        const result = isTerrainSuitable('tent', terrain);
        expect(result.suitable).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid building ID', () => {
      const result = isTerrainSuitable('invalid_building', TerrainType.GRASSLAND);

      expect(result.suitable).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});
