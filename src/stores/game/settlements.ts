/**
 * Settlements Store
 * Manages settlements (villages and cities) formed by wall loops
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Settlement,
  SettlementType,
  SettlementFormationEvent,
  SettlementDestructionEvent,
  WallLoop,
  PlayerId,
  TileKey,
  PlayerSettlements,
} from '@/data/types';
import { SettlementType as SettType } from '@/data/types';
import { SettlementManager } from '@/game/engine/settlement-manager';
import { WallDetector } from '@/game/engine/wall-detector';
import { WallManager } from '@/game/engine/wall-manager';

export const useSettlementsStore = defineStore('settlements', () => {
  // Settlement manager instance (not reactive - these are just logic classes)
  const settlementManager = new SettlementManager();
  const wallManager = new WallManager();
  const wallDetector = new WallDetector(wallManager);

  // Events
  const formationEvents = ref<SettlementFormationEvent[]>([]);
  const destructionEvents = ref<SettlementDestructionEvent[]>([]);

  // Current detected loops (for debugging/visualization)
  const currentLoops = ref<WallLoop[]>([]);
  const invalidLoops = ref<WallLoop[]>([]);

  /**
   * Detect wall loops and update settlements
   */
  function detectAndUpdateSettlements(
    mapBounds: { minX: number; minY: number; maxX: number; maxY: number },
    turnNumber: number,
  ): void {
    // Detect all loops on the map
    const detection = wallDetector.detectAllLoops(mapBounds);
    currentLoops.value = detection.loops;
    invalidLoops.value = detection.invalidLoops;

    // Get existing settlement IDs
    const existingIds = new Set(
      settlementManager.getAllSettlements().map((s) => s.settlementId),
    );

    // Track which settlements are still valid
    const validIds = new Set<string>();

    // Process valid loops
    for (const loop of detection.loops) {
      validIds.add(loop.loopId);

      if (existingIds.has(loop.loopId)) {
        // Update existing settlement
        const result = settlementManager.updateSettlement(loop.loopId, loop, turnNumber);

        if (result?.upgraded) {
          // Settlement upgraded from village to city
          const event: SettlementFormationEvent = {
            settlementId: result.settlement.settlementId,
            settlementType: result.settlement.type,
            ownerId: result.settlement.ownerId,
            wallMaterial: loop.material,
            area: loop.area,
            turnNumber,
          };
          formationEvents.value.push(event);
        }
      } else {
        // Create new settlement
        const result = settlementManager.createSettlement(loop, turnNumber);

        if (result) {
          formationEvents.value.push(result.event);
        }
      }
    }

    // Remove settlements that no longer have valid loops
    for (const existingId of existingIds) {
      if (!validIds.has(existingId)) {
        const event = settlementManager.removeSettlement(existingId, 'WALL_DESTROYED', turnNumber);

        if (event) {
          destructionEvents.value.push(event);
        }
      }
    }
  }

  /**
   * Get all settlements
   */
  function getAllSettlements(): Settlement[] {
    return settlementManager.getAllSettlements();
  }

  /**
   * Get settlement by ID
   */
  function getSettlement(settlementId: string): Settlement | undefined {
    return settlementManager.getSettlement(settlementId);
  }

  /**
   * Get player settlements
   */
  function getPlayerSettlements(playerId: PlayerId): Settlement[] {
    return settlementManager.getPlayerSettlements(playerId);
  }

  /**
   * Get player settlements summary
   */
  function getPlayerSettlementsSummary(playerId: PlayerId): PlayerSettlements {
    const settlements = settlementManager.getPlayerSettlements(playerId);
    const villages = settlements.filter((s) => s.type === SettType.VILLAGE);
    const cities = settlements.filter((s) => s.type === SettType.CITY);

    return {
      playerId,
      villages,
      cities,
      totalSettlements: settlements.length,
      totalPopulation: settlements.reduce((sum, s) => sum + s.population, 0),
      totalArea: settlements.reduce((sum, s) => sum + s.area, 0),
    };
  }

  /**
   * Get settlements by type
   */
  function getSettlementsByType(type: SettlementType): Settlement[] {
    return settlementManager.getSettlementsByType(type);
  }

  /**
   * Get settlement at tile
   */
  function getSettlementAtTile(tileKey: TileKey): Settlement | undefined {
    return settlementManager.getTileSettlement(tileKey);
  }

  /**
   * Update settlement stats
   */
  function updateSettlementStats(
    settlementId: string,
    stats: { population?: number; buildingCount?: number; militaryStrength?: number },
  ): void {
    settlementManager.updateSettlementStats(settlementId, stats);
  }

  /**
   * Get wall manager (for wall placement)
   */
  function getWallManager(): WallManager {
    return wallManager;
  }

  /**
   * Get recent formation events
   */
  function getRecentFormationEvents(count = 10): SettlementFormationEvent[] {
    return formationEvents.value.slice(-count);
  }

  /**
   * Get recent destruction events
   */
  function getRecentDestructionEvents(count = 10): SettlementDestructionEvent[] {
    return destructionEvents.value.slice(-count);
  }

  /**
   * Clear formation events
   */
  function clearFormationEvents(): void {
    formationEvents.value = [];
  }

  /**
   * Clear destruction events
   */
  function clearDestructionEvents(): void {
    destructionEvents.value = [];
  }

  /**
   * Get current detected loops (for debugging/visualization)
   */
  function getCurrentLoops(): WallLoop[] {
    return currentLoops.value;
  }

  /**
   * Get invalid loops (for debugging/visualization)
   */
  function getInvalidLoops(): WallLoop[] {
    return invalidLoops.value;
  }

  /**
   * Reset store
   */
  function reset(): void {
    settlementManager.clear();
    wallManager.clear();
    formationEvents.value = [];
    destructionEvents.value = [];
    currentLoops.value = [];
    invalidLoops.value = [];
  }

  /**
   * Serialize settlements store state for saving
   */
  function serialize() {
    return {
      settlements: settlementManager.getAllSettlements(),
      wallSegments: [] as unknown[], // TODO: Add wall serialization from WallManager
      formationEvents: [...formationEvents.value],
      destructionEvents: [...destructionEvents.value],
      currentLoops: [...currentLoops.value],
      invalidLoops: [...invalidLoops.value],
    };
  }

  /**
   * Deserialize settlements store state from save data
   */
  function deserialize(data: ReturnType<typeof serialize>): void {
    // Clear existing data
    settlementManager.clear();
    wallManager.clear();

    // Restore events and loops
    formationEvents.value = [...data.formationEvents];
    destructionEvents.value = [...data.destructionEvents];
    currentLoops.value = [...data.currentLoops];
    invalidLoops.value = [...data.invalidLoops];

    // Note: Settlement restoration would require SettlementManager
    // to have proper deserialization methods. This is a simplified version.
    // Settlements are typically re-detected from wall structures.
  }

  // Computed properties
  const settlementCount = computed(() => settlementManager.getSettlementCount());
  const totalVillages = computed(
    () => settlementManager.getSettlementsByType(SettType.VILLAGE).length,
  );
  const totalCities = computed(() => settlementManager.getSettlementsByType(SettType.CITY).length);

  return {
    // State
    formationEvents,
    destructionEvents,
    currentLoops,
    invalidLoops,

    // Actions
    detectAndUpdateSettlements,
    getAllSettlements,
    getSettlement,
    getPlayerSettlements,
    getPlayerSettlementsSummary,
    getSettlementsByType,
    getSettlementAtTile,
    updateSettlementStats,
    getWallManager,
    getRecentFormationEvents,
    getRecentDestructionEvents,
    clearFormationEvents,
    clearDestructionEvents,
    getCurrentLoops,
    getInvalidLoops,
    reset,
    serialize,
    deserialize,

    // Computed
    settlementCount,
    totalVillages,
    totalCities,
  };
});
