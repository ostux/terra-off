/**
 * Peasant Store
 * Manages player-wide peasant population and allocation
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  PlayerId,
  EntityId,
  PeasantAllocation,
  PlayerPeasantState,
  PeasantAllocationChange,
  PeasantAllocationValidation,
  Coordinates,
} from '@/data/types';
import { AllocationTargetType } from '@/data/types';
import { calculatePeasantEfficiency } from '@/data/config';

export const usePeasantsStore = defineStore('peasants', () => {
  // Per-player peasant states
  const playerPeasantStates = ref(new Map<PlayerId, PlayerPeasantState>());

  /**
   * Initialize peasants for a player
   */
  function initializePlayerPeasants(playerId: PlayerId): void {
    const initialState: PlayerPeasantState = {
      playerId,
      totalPeasants: 0,
      allocatedPeasants: 0,
      unallocatedPeasants: 0,
      allocations: new Map(),
      peasantSources: [],
    };

    playerPeasantStates.value.set(playerId, initialState);
  }

  /**
   * Get peasant state for a player
   */
  function getPlayerPeasantState(playerId: PlayerId): PlayerPeasantState | null {
    return playerPeasantStates.value.get(playerId) || null;
  }

  /**
   * Add peasant source (infrastructure building)
   */
  function addPeasantSource(
    playerId: PlayerId,
    buildingEntityId: EntityId,
    buildingId: string,
    coordinates: Coordinates,
    peasantsGenerated: number,
  ): void {
    const state = playerPeasantStates.value.get(playerId);
    if (!state) return;

    // Check if source already exists
    const existingSource = state.peasantSources.find(
      (s) => s.buildingEntityId === buildingEntityId,
    );
    if (existingSource) return;

    state.peasantSources.push({
      buildingEntityId,
      buildingId,
      coordinates,
      peasantsGenerated,
    });

    recalculateTotalPeasants(playerId);
  }

  /**
   * Remove peasant source (building destroyed)
   */
  function removePeasantSource(playerId: PlayerId, buildingEntityId: EntityId): void {
    const state = playerPeasantStates.value.get(playerId);
    if (!state) return;

    const sourceIndex = state.peasantSources.findIndex(
      (s) => s.buildingEntityId === buildingEntityId,
    );

    if (sourceIndex === -1) return;

    state.peasantSources.splice(sourceIndex, 1);
    recalculateTotalPeasants(playerId);
  }

  /**
   * Recalculate total peasants from all sources
   */
  function recalculateTotalPeasants(playerId: PlayerId): void {
    const state = playerPeasantStates.value.get(playerId);
    if (!state) return;

    const total = state.peasantSources.reduce(
      (sum, source) => sum + source.peasantsGenerated,
      0,
    );

    state.totalPeasants = total;
    state.unallocatedPeasants = total - state.allocatedPeasants;

    // If total decreased below allocated, deallocate excess
    if (state.allocatedPeasants > total) {
      handlePeasantShortage(playerId);
    }
  }

  /**
   * Handle peasant shortage (total < allocated)
   */
  function handlePeasantShortage(playerId: PlayerId): void {
    const state = playerPeasantStates.value.get(playerId);
    if (!state) return;

    const excess = state.allocatedPeasants - state.totalPeasants;
    if (excess <= 0) return;

    // Deallocate from buildings proportionally
    const allocationsArray = Array.from(state.allocations.values());
    const totalAllocated = state.allocatedPeasants;

    for (const allocation of allocationsArray) {
      const proportion = allocation.peasantCount / totalAllocated;
      const toRemove = Math.floor(excess * proportion);

      if (toRemove > 0) {
        const newCount = Math.max(0, allocation.peasantCount - toRemove);
        allocatePeasants(
          playerId,
          allocation.targetId,
          allocation.targetType,
          allocation.coordinates,
          allocation.requiredForOptimal,
          newCount,
        );
      }
    }

    recalculateAllocatedPeasants(playerId);
  }

  /**
   * Allocate peasants to a building or resource
   */
  function allocatePeasants(
    playerId: PlayerId,
    targetId: EntityId,
    targetType: AllocationTargetType,
    coordinates: Coordinates,
    requiredForOptimal: number,
    peasantCount: number,
  ): PeasantAllocationChange | null {
    const state = playerPeasantStates.value.get(playerId);
    if (!state) return null;

    const existing = state.allocations.get(targetId);
    const previousCount = existing?.peasantCount || 0;

    // Validate allocation
    const validation = validateAllocation(playerId, targetId, peasantCount);
    if (!validation.valid) {
      console.warn(`Invalid allocation: ${validation.error}`);
      return null;
    }

    // Calculate efficiency
    const efficiency = calculatePeasantEfficiency(peasantCount, requiredForOptimal);
    const previousEfficiency = existing
      ? calculatePeasantEfficiency(existing.peasantCount, requiredForOptimal)
      : 0;

    // Update or create allocation
    state.allocations.set(targetId, {
      targetType,
      targetId,
      coordinates,
      peasantCount,
      requiredForOptimal,
      currentEfficiency: efficiency,
    });

    recalculateAllocatedPeasants(playerId);

    return {
      playerId,
      targetId,
      previousCount,
      newCount: peasantCount,
      efficiencyChange: {
        before: previousEfficiency,
        after: efficiency,
      },
    };
  }

  /**
   * Deallocate peasants from a target
   */
  function deallocatePeasants(playerId: PlayerId, targetId: EntityId): boolean {
    const state = playerPeasantStates.value.get(playerId);
    if (!state) return false;

    const deleted = state.allocations.delete(targetId);
    if (deleted) {
      recalculateAllocatedPeasants(playerId);
    }

    return deleted;
  }

  /**
   * Recalculate total allocated peasants
   */
  function recalculateAllocatedPeasants(playerId: PlayerId): void {
    const state = playerPeasantStates.value.get(playerId);
    if (!state) return;

    const allocated = Array.from(state.allocations.values()).reduce(
      (sum, allocation) => sum + allocation.peasantCount,
      0,
    );

    state.allocatedPeasants = allocated;
    state.unallocatedPeasants = state.totalPeasants - allocated;
  }

  /**
   * Validate peasant allocation
   */
  function validateAllocation(
    playerId: PlayerId,
    targetId: EntityId,
    requestedCount: number,
  ): PeasantAllocationValidation {
    const state = playerPeasantStates.value.get(playerId);

    if (!state) {
      return {
        valid: false,
        error: 'Player peasant state not found',
        availablePeasants: 0,
        requestedAllocation: requestedCount,
        wouldExceedAvailable: true,
      };
    }

    const existing = state.allocations.get(targetId);
    const currentlyAllocatedToTarget = existing?.peasantCount || 0;
    const _netChange = requestedCount - currentlyAllocatedToTarget;
    const availableForReallocation = state.unallocatedPeasants + currentlyAllocatedToTarget;

    if (requestedCount > availableForReallocation) {
      return {
        valid: false,
        error: `Not enough peasants. Need ${requestedCount}, have ${availableForReallocation}`,
        availablePeasants: availableForReallocation,
        requestedAllocation: requestedCount,
        wouldExceedAvailable: true,
      };
    }

    if (requestedCount < 0) {
      return {
        valid: false,
        error: 'Cannot allocate negative peasants',
        availablePeasants: availableForReallocation,
        requestedAllocation: requestedCount,
        wouldExceedAvailable: false,
      };
    }

    return {
      valid: true,
      availablePeasants: availableForReallocation,
      requestedAllocation: requestedCount,
      wouldExceedAvailable: false,
    };
  }

  /**
   * Get allocation for a target
   */
  function getAllocation(playerId: PlayerId, targetId: EntityId): PeasantAllocation | null {
    const state = playerPeasantStates.value.get(playerId);
    return state?.allocations.get(targetId) || null;
  }

  /**
   * Get all allocations for a player
   */
  function getAllAllocations(playerId: PlayerId): PeasantAllocation[] {
    const state = playerPeasantStates.value.get(playerId);
    return state ? Array.from(state.allocations.values()) : [];
  }

  /**
   * Get peasant statistics
   */
  function getPeasantStats(playerId: PlayerId) {
    const state = playerPeasantStates.value.get(playerId);

    if (!state) {
      return {
        totalPeasants: 0,
        allocated: 0,
        unallocated: 0,
        utilizationRate: 0,
        averageEfficiency: 0,
        suboptimalAllocations: 0,
      };
    }

    const allocations = Array.from(state.allocations.values());
    const avgEfficiency =
      allocations.length > 0
        ? allocations.reduce((sum, a) => sum + a.currentEfficiency, 0) / allocations.length
        : 0;

    const suboptimal = allocations.filter((a) => a.currentEfficiency < 1.0).length;

    return {
      totalPeasants: state.totalPeasants,
      allocated: state.allocatedPeasants,
      unallocated: state.unallocatedPeasants,
      utilizationRate: state.totalPeasants > 0
        ? (state.allocatedPeasants / state.totalPeasants) * 100
        : 0,
      averageEfficiency: avgEfficiency,
      suboptimalAllocations: suboptimal,
    };
  }

  /**
   * Reset peasants store (new game)
   */
  function reset(): void {
    playerPeasantStates.value.clear();
  }

  /**
   * Serialize peasants store state for saving
   * Using the pattern of storing only values since keys are embedded in objects
   */
  function serialize() {
    const playerStatesArray = Array.from(playerPeasantStates.value.values()).map((state) => {
      return {
        playerId: state.playerId,
        totalPeasants: state.totalPeasants,
        allocatedPeasants: state.allocatedPeasants,
        unallocatedPeasants: state.unallocatedPeasants,
        allocations: Array.from(state.allocations.values()),
        peasantSources: [...state.peasantSources],
      };
    });

    return {
      playerPeasantStates: playerStatesArray,
    };
  }

  /**
   * Deserialize peasants store state from save data
   * Reconstruct Map keys from embedded object properties
   */
  function deserialize(data: ReturnType<typeof serialize>): void {
    playerPeasantStates.value = new Map(
      data.playerPeasantStates.map((state) => {
        return [
          state.playerId,
          {
            ...state,
            // Reconstruct allocations Map using targetId as key
            allocations: new Map(
              state.allocations.map((allocation) => [allocation.targetId, allocation])
            ),
          },
        ];
      })
    );
  }

  return {
    // Initialization
    initializePlayerPeasants,

    // State access
    getPlayerPeasantState,
    getAllocation,
    getAllAllocations,
    getPeasantStats,

    // Peasant sources
    addPeasantSource,
    removePeasantSource,
    recalculateTotalPeasants,

    // Allocation
    allocatePeasants,
    deallocatePeasants,
    validateAllocation,

    // Utilities
    reset,
    serialize,
    deserialize,
  };
});
