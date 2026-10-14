/**
 * Buildings Store
 * Manages placed buildings, construction queue, and building-related state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  PlayerId,
  EntityId,
  Coordinates,
  ResourceCost,
} from '@/data/types';
import type { BuildingDefinition } from '@/data/buildings';
import { getBuildingById } from '@/data/buildings';
import { toTileKey } from '@/data/types';

/**
 * A placed building instance on the map
 */
export interface PlacedBuilding {
  entityId: EntityId; // Unique instance ID
  buildingId: string; // Reference to BuildingDefinition
  playerId: PlayerId;
  coordinates: Coordinates;
  level: number; // Building level (for upgrades, Phase 7)
  completedAt: number; // Turn number when construction finished
}

/**
 * A building currently under construction
 */
export interface BuildingInConstruction {
  entityId: EntityId;
  buildingId: string;
  playerId: PlayerId;
  coordinates: Coordinates;
  turnsRemaining: number;
  totalTurns: number;
  startedAt: number; // Turn number when construction started
}

export const useBuildingsStore = defineStore('buildings', () => {
  // All completed buildings on the map
  const placedBuildings = ref(new Map<string, PlacedBuilding>());

  // Buildings currently under construction
  const constructionQueue = ref(new Map<EntityId, BuildingInConstruction>());

  // Entity ID counter for generating unique building IDs
  let nextEntityId = 1;

  /**
   * Generate unique entity ID for a building
   */
  function generateEntityId(): EntityId {
    return `building-${nextEntityId++}`;
  }

  /**
   * Get all buildings for a player
   */
  function getPlayerBuildings(playerId: PlayerId): PlacedBuilding[] {
    return Array.from(placedBuildings.value.values()).filter(
      (b) => b.playerId === playerId,
    );
  }

  /**
   * Get building at specific coordinates
   */
  function getBuildingAt(coordinates: Coordinates): PlacedBuilding | null {
    const tileKey = toTileKey(coordinates.x, coordinates.y);
    return placedBuildings.value.get(tileKey) || null;
  }

  /**
   * Check if tile has a building
   */
  function hasBuildingAt(coordinates: Coordinates): boolean {
    const tileKey = toTileKey(coordinates.x, coordinates.y);
    return placedBuildings.value.has(tileKey);
  }

  /**
   * Get building under construction at coordinates
   */
  function getConstructionAt(coordinates: Coordinates): BuildingInConstruction | null {
    for (const construction of constructionQueue.value.values()) {
      if (
        construction.coordinates.x === coordinates.x &&
        construction.coordinates.y === coordinates.y
      ) {
        return construction;
      }
    }
    return null;
  }

  /**
   * Check if tile has building under construction
   */
  function hasConstructionAt(coordinates: Coordinates): boolean {
    return getConstructionAt(coordinates) !== null;
  }

  /**
   * Start building construction
   */
  function startConstruction(
    playerId: PlayerId,
    buildingId: string,
    coordinates: Coordinates,
    turnNumber: number,
  ): EntityId | null {
    const buildingDef = getBuildingById(buildingId);
    if (!buildingDef) {
      console.error(`Building definition not found: ${buildingId}`);
      return null;
    }

    // Check if tile is occupied
    if (hasBuildingAt(coordinates) || hasConstructionAt(coordinates)) {
      console.warn(`Tile already occupied at (${coordinates.x}, ${coordinates.y})`);
      return null;
    }

    const entityId = generateEntityId();

    const construction: BuildingInConstruction = {
      entityId,
      buildingId,
      playerId,
      coordinates,
      turnsRemaining: buildingDef.constructionTurns,
      totalTurns: buildingDef.constructionTurns,
      startedAt: turnNumber,
    };

    constructionQueue.value.set(entityId, construction);

    return entityId;
  }

  /**
   * Progress all construction by one turn
   * Called during turn resolution
   */
  function progressConstruction(turnNumber: number): PlacedBuilding[] {
    const completed: PlacedBuilding[] = [];

    for (const [entityId, construction] of constructionQueue.value.entries()) {
      construction.turnsRemaining--;

      if (construction.turnsRemaining <= 0) {
        // Construction complete!
        const placedBuilding: PlacedBuilding = {
          entityId: construction.entityId,
          buildingId: construction.buildingId,
          playerId: construction.playerId,
          coordinates: construction.coordinates,
          level: 1,
          completedAt: turnNumber,
        };

        // Add to placed buildings
        const tileKey = toTileKey(construction.coordinates.x, construction.coordinates.y);
        placedBuildings.value.set(tileKey, placedBuilding);

        // Remove from construction queue
        constructionQueue.value.delete(entityId);

        completed.push(placedBuilding);
      }
    }

    return completed;
  }

  /**
   * Cancel construction and get partial refund
   */
  function cancelConstruction(entityId: EntityId): ResourceCost | null {
    const construction = constructionQueue.value.get(entityId);
    if (!construction) return null;

    const buildingDef = getBuildingById(construction.buildingId);
    if (!buildingDef) return null;

    // Calculate refund (50% of costs based on remaining turns)
    const refundPercentage =
      (construction.turnsRemaining / construction.totalTurns) * 0.5;
    const refund: ResourceCost = {};

    for (const [resource, cost] of Object.entries(buildingDef.cost)) {
      if (cost) {
        (refund as Record<string, number>)[resource] = Math.floor(cost * refundPercentage);
      }
    }

    // Remove from queue
    constructionQueue.value.delete(entityId);

    return refund;
  }

  /**
   * Demolish a placed building
   */
  function demolishBuilding(
    coordinates: Coordinates,
  ): { building: PlacedBuilding; refund: ResourceCost } | null {
    const tileKey = toTileKey(coordinates.x, coordinates.y);
    const building = placedBuildings.value.get(tileKey);

    if (!building) return null;

    const buildingDef = getBuildingById(building.buildingId);
    if (!buildingDef) return null;

    // Calculate refund (25% of original cost)
    const refund: ResourceCost = {};
    for (const [resource, cost] of Object.entries(buildingDef.cost)) {
      if (cost) {
        (refund as Record<string, number>)[resource] = Math.floor(cost * 0.25);
      }
    }

    // Remove building
    placedBuildings.value.delete(tileKey);

    return { building, refund };
  }

  /**
   * Get construction queue for a player
   */
  function getPlayerConstructionQueue(playerId: PlayerId): BuildingInConstruction[] {
    return Array.from(constructionQueue.value.values()).filter(
      (c) => c.playerId === playerId,
    );
  }

  /**
   * Get building statistics
   */
  function getBuildingStats(playerId: PlayerId) {
    const playerBuildings = getPlayerBuildings(playerId);
    const playerConstruction = getPlayerConstructionQueue(playerId);

    // Count by category
    const byCategory = new Map<string, number>();
    for (const building of playerBuildings) {
      const def = getBuildingById(building.buildingId);
      if (def) {
        byCategory.set(def.category, (byCategory.get(def.category) || 0) + 1);
      }
    }

    return {
      totalBuildings: playerBuildings.length,
      underConstruction: playerConstruction.length,
      byCategory: Object.fromEntries(byCategory),
    };
  }

  /**
   * Calculate total peasant generation from infrastructure buildings
   */
  function calculateTotalPeasantGeneration(playerId: PlayerId): number {
    const playerBuildings = getPlayerBuildings(playerId);
    let total = 0;

    for (const building of playerBuildings) {
      const def = getBuildingById(building.buildingId);
      if (def?.peasantGeneration) {
        total += def.peasantGeneration;
      }
    }

    return total;
  }

  /**
   * Get all buildings that can produce resources
   */
  function getProductionBuildings(playerId: PlayerId): Array<{
    building: PlacedBuilding;
    definition: BuildingDefinition;
  }> {
    const playerBuildings = getPlayerBuildings(playerId);
    const productionBuildings: Array<{
      building: PlacedBuilding;
      definition: BuildingDefinition;
    }> = [];

    for (const building of playerBuildings) {
      const def = getBuildingById(building.buildingId);
      if (def?.production) {
        productionBuildings.push({ building, definition: def });
      }
    }

    return productionBuildings;
  }

  /**
   * Reset buildings store (new game)
   */
  function reset(): void {
    placedBuildings.value.clear();
    constructionQueue.value.clear();
    nextEntityId = 1;
  }

  /**
   * Serialize buildings store state for saving
   * Using the pattern of storing only values since keys are embedded in objects
   */
  function serialize() {
    return {
      placedBuildings: Array.from(placedBuildings.value.values()),
      constructionQueue: Array.from(constructionQueue.value.values()),
      nextEntityId,
    };
  }

  /**
   * Deserialize buildings store state from save data
   * Reconstruct Map keys from embedded object properties
   */
  function deserialize(data: ReturnType<typeof serialize>): void {
    // Reconstruct placedBuildings Map using coordinates to generate TileKey
    placedBuildings.value = new Map(
      data.placedBuildings.map((building) => [
        toTileKey(building.coordinates.x, building.coordinates.y),
        building,
      ])
    );

    // Reconstruct constructionQueue Map using entityId as key
    constructionQueue.value = new Map(
      data.constructionQueue.map((construction) => [construction.entityId, construction])
    );

    nextEntityId = data.nextEntityId;
  }

  return {
    // State
    placedBuildings: computed(() => Array.from(placedBuildings.value.values())),
    constructionQueue: computed(() => Array.from(constructionQueue.value.values())),

    // Building queries
    getPlayerBuildings,
    getBuildingAt,
    hasBuildingAt,
    getConstructionAt,
    hasConstructionAt,
    getBuildingStats,
    calculateTotalPeasantGeneration,
    getProductionBuildings,

    // Construction management
    startConstruction,
    progressConstruction,
    cancelConstruction,
    getPlayerConstructionQueue,

    // Building management
    demolishBuilding,

    // Utilities
    reset,
    serialize,
    deserialize,
  };
});
