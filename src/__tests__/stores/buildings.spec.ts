/**
 * Buildings Store Tests
 * Tests for building placement, construction, and serialization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBuildingsStore } from '@/stores/game/buildings';

describe('Buildings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Construction Management', () => {
    it('should start construction', () => {
      const store = useBuildingsStore();
      const playerId = 'player-1' as any;
      const coordinates = { x: 5, y: 5 };

      const entityId = store.startConstruction(playerId, 'tent', coordinates, 1);

      expect(entityId).toBeDefined();
      expect(entityId).toMatch(/^building-/);
    });

    it('should prevent building on occupied tile', () => {
      const store = useBuildingsStore();
      const playerId = 'player-1' as any;
      const coordinates = { x: 5, y: 5 };

      // First building succeeds
      const firstId = store.startConstruction(playerId, 'tent', coordinates, 1);
      expect(firstId).toBeDefined();

      // Second building on same tile fails
      const secondId = store.startConstruction(playerId, 'farm', coordinates, 1);
      expect(secondId).toBeNull();
    });

    it('should complete construction after N turns', () => {
      const store = useBuildingsStore();
      const playerId = 'player-1' as any;
      const coordinates = { x: 5, y: 5 };

      // Start construction (tent takes 1 turn)
      store.startConstruction(playerId, 'tent', coordinates, 1);

      // Progress construction
      const completed = store.progressConstruction(2);

      expect(completed).toHaveLength(1);
      expect(completed[0].buildingId).toBe('tent');
      expect(completed[0].coordinates).toEqual(coordinates);

      // Check building is now placed
      const building = store.getBuildingAt(coordinates);
      expect(building).toBeDefined();
      expect(building?.buildingId).toBe('tent');
    });

    it('should handle multi-turn construction', () => {
      const store = useBuildingsStore();
      const playerId = 'player-1' as any;
      const coordinates = { x: 5, y: 5 };

      // Start construction (farm takes 3 turns)
      store.startConstruction(playerId, 'farm', coordinates, 1);

      // Turn 1 - not complete
      let completed = store.progressConstruction(2);
      expect(completed).toHaveLength(0);
      expect(store.getBuildingAt(coordinates)).toBeNull();

      // Turn 2 - not complete
      completed = store.progressConstruction(3);
      expect(completed).toHaveLength(0);

      // Turn 3 - complete
      completed = store.progressConstruction(4);
      expect(completed).toHaveLength(1);
      expect(store.getBuildingAt(coordinates)).toBeDefined();
    });
  });

  describe('Demolition', () => {
    it('should demolish building and give refund', () => {
      const store = useBuildingsStore();
      const playerId = 'player-1' as any;
      const coordinates = { x: 5, y: 5 };

      // Build and complete
      store.startConstruction(playerId, 'tent', coordinates, 1);
      store.progressConstruction(2);

      // Demolish
      const result = store.demolishBuilding(coordinates);

      expect(result).toBeDefined();
      expect(result?.building.buildingId).toBe('tent');
      expect(result?.refund).toBeDefined();
      // Tent costs 5 wood, 25% refund = 1 wood (floored from 1.25)
      expect(result?.refund.WOOD).toBe(1);

      // Building should be gone
      expect(store.getBuildingAt(coordinates)).toBeNull();
    });

    it('should return null when demolishing empty tile', () => {
      const store = useBuildingsStore();
      const coordinates = { x: 5, y: 5 };

      const result = store.demolishBuilding(coordinates);
      expect(result).toBeNull();
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize store state', () => {
      const store = useBuildingsStore();
      const playerId = 'player-1' as any;

      // Create some buildings
      store.startConstruction(playerId, 'tent', { x: 1, y: 1 }, 1);
      store.startConstruction(playerId, 'farm', { x: 2, y: 2 }, 1);
      store.progressConstruction(2); // Complete tent

      // Serialize
      const serialized = store.serialize();

      expect(serialized.placedBuildings).toHaveLength(1);
      expect(serialized.constructionQueue).toHaveLength(1);
      expect(serialized.nextEntityId).toBeGreaterThan(1);

      // Create new store and deserialize
      const newStore = useBuildingsStore();
      newStore.deserialize(serialized);

      // Verify data restored
      expect(newStore.placedBuildings).toHaveLength(1);
      expect(newStore.constructionQueue).toHaveLength(1);

      const building = newStore.getBuildingAt({ x: 1, y: 1 });
      expect(building?.buildingId).toBe('tent');

      const construction = newStore.getConstructionAt({ x: 2, y: 2 });
      expect(construction?.buildingId).toBe('farm');
    });
  });

  describe('Queries', () => {
    it('should get player buildings', () => {
      const store = useBuildingsStore();
      const player1 = 'player-1' as any;
      const player2 = 'player-2' as any;

      // Build for both players
      store.startConstruction(player1, 'tent', { x: 1, y: 1 }, 1);
      store.startConstruction(player2, 'tent', { x: 2, y: 2 }, 1);
      store.progressConstruction(2);

      const player1Buildings = store.getPlayerBuildings(player1);
      const player2Buildings = store.getPlayerBuildings(player2);

      expect(player1Buildings).toHaveLength(1);
      expect(player2Buildings).toHaveLength(1);
      expect(player1Buildings[0].coordinates).toEqual({ x: 1, y: 1 });
      expect(player2Buildings[0].coordinates).toEqual({ x: 2, y: 2 });
    });

    it('should check if tile has building', () => {
      const store = useBuildingsStore();
      const playerId = 'player-1' as any;

      store.startConstruction(playerId, 'tent', { x: 5, y: 5 }, 1);
      store.progressConstruction(2);

      expect(store.hasBuildingAt({ x: 5, y: 5 })).toBe(true);
      expect(store.hasBuildingAt({ x: 6, y: 6 })).toBe(false);
    });
  });
});
