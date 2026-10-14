/**
 * Peasants Store Tests
 * Tests for peasant allocation and management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePeasantsStore } from '@/stores/game/peasants';
import { AllocationTargetType } from '@/data/types';

describe('Peasants Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Initialization', () => {
    it('should initialize player peasants', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);

      const state = store.getPlayerPeasantState(playerId);
      expect(state).toBeDefined();
      expect(state?.totalPeasants).toBe(0);
      expect(state?.allocatedPeasants).toBe(0);
      expect(state?.unallocatedPeasants).toBe(0);
    });
  });

  describe('Peasant Generation', () => {
    it('should add peasant source', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'building-1', 'Tent', { x: 0, y: 0 }, 3);

      const state = store.getPlayerPeasantState(playerId);
      expect(state?.totalPeasants).toBe(3);
      expect(state?.unallocatedPeasants).toBe(3);
    });

    it('should remove peasant source', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'building-1', 'Tent', { x: 0, y: 0 }, 3);
      store.removePeasantSource(playerId, 'building-1');

      const state = store.getPlayerPeasantState(playerId);
      expect(state?.totalPeasants).toBe(0);
      expect(state?.unallocatedPeasants).toBe(0);
    });

    it('should handle multiple sources', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'building-1', 'Tent', { x: 0, y: 0 }, 3);
      store.addPeasantSource(playerId, 'building-2', 'Hut', { x: 1, y: 1 }, 5);

      const state = store.getPlayerPeasantState(playerId);
      expect(state?.totalPeasants).toBe(8);
      expect(state?.unallocatedPeasants).toBe(8);
    });
  });

  describe('Peasant Allocation', () => {
    it('should allocate peasants to building', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'source-1', 'Test', { x: 0, y: 0 }, 10);

      const result = store.allocatePeasants(
        playerId,
        'farm-1',
        AllocationTargetType.BUILDING,
        { x: 1, y: 1 },
        6, // requiredForOptimal
        6  // peasantCount
      );

      expect(result).toBeDefined();

      const state = store.getPlayerPeasantState(playerId);
      expect(state?.allocatedPeasants).toBe(6);
      expect(state?.unallocatedPeasants).toBe(4);

      const allocation = store.getAllocation(playerId, 'farm-1');
      expect(allocation?.peasantCount).toBe(6);
    });

    it('should prevent over-allocation', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'source-1', 'Test', { x: 0, y: 0 }, 5);

      const result = store.allocatePeasants(
        playerId,
        'farm-1',
        AllocationTargetType.BUILDING,
        { x: 1, y: 1 },
        6,
        10 // More than available
      );

      expect(result).toBeNull();
    });

    it('should reallocate peasants', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'source-1', 'Test', { x: 0, y: 0 }, 10);

      // Initial allocation
      store.allocatePeasants(playerId, 'farm-1', AllocationTargetType.BUILDING, { x: 1, y: 1 }, 6, 6);

      // Reallocate to fewer
      const result = store.allocatePeasants(
        playerId,
        'farm-1',
        AllocationTargetType.BUILDING,
        { x: 1, y: 1 },
        6,
        3
      );

      expect(result).toBeDefined();

      const state = store.getPlayerPeasantState(playerId);
      expect(state?.allocatedPeasants).toBe(3);
      expect(state?.unallocatedPeasants).toBe(7);
    });

    it('should remove allocation', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'source-1', 'Test', { x: 0, y: 0 }, 10);
      store.allocatePeasants(playerId, 'farm-1', AllocationTargetType.BUILDING, { x: 1, y: 1 }, 6, 6);

      store.deallocatePeasants(playerId, 'farm-1');

      const state = store.getPlayerPeasantState(playerId);
      expect(state?.allocatedPeasants).toBe(0);
      expect(state?.unallocatedPeasants).toBe(10);

      const allocation = store.getAllocation(playerId, 'farm-1');
      expect(allocation).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate sufficient peasants', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'source-1', 'Test', { x: 0, y: 0 }, 10);

      const validation = store.validateAllocation(playerId, 'farm-1', 6);
      expect(validation.valid).toBe(true);
    });

    it('should validate insufficient peasants', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'source-1', 'Test', { x: 0, y: 0 }, 5);

      const validation = store.validateAllocation(playerId, 'farm-1', 10);
      expect(validation.valid).toBe(false);
      expect(validation.wouldExceedAvailable).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize peasant state', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      // Setup state
      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'building-1', 'Tent', { x: 0, y: 0 }, 10);
      store.allocatePeasants(playerId, 'farm-1', AllocationTargetType.BUILDING, { x: 1, y: 1 }, 6, 6);

      // Serialize
      const serialized = store.serialize();
      expect(serialized.playerPeasantStates).toHaveLength(1);

      // Create new store and deserialize
      const newStore = usePeasantsStore();
      newStore.deserialize(serialized);

      // Verify
      const state = newStore.getPlayerPeasantState(playerId);
      expect(state?.totalPeasants).toBe(10);
      expect(state?.allocatedPeasants).toBe(6);
      expect(state?.unallocatedPeasants).toBe(4);

      const allocation = newStore.getAllocation(playerId, 'farm-1');
      expect(allocation?.peasantCount).toBe(6);
    });
  });

  describe('Statistics', () => {
    it('should calculate peasant statistics', () => {
      const store = usePeasantsStore();
      const playerId = 'player-1' as any;

      store.initializePlayerPeasants(playerId);
      store.addPeasantSource(playerId, 'building-1', 'Tent', { x: 0, y: 0 }, 10);
      store.allocatePeasants(playerId, 'farm-1', AllocationTargetType.BUILDING, { x: 1, y: 1 }, 6, 6);
      store.allocatePeasants(playerId, 'farm-2', AllocationTargetType.BUILDING, { x: 2, y: 2 }, 6, 3);

      const stats = store.getPeasantStats(playerId);

      expect(stats?.totalPeasants).toBe(10);
      expect(stats?.allocated).toBe(9);
      expect(stats?.unallocated).toBe(1);
    });
  });
});
