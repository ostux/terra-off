/**
 * Exploration Store
 * Per-player exploration tracking and fog of war state
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlayerId, TileKey, FogState, TileSnapshot } from '@/data/types';
import { FogManager } from '@/game/engine/fog-manager';

export const useExplorationStore = defineStore('exploration', () => {
  // Fog manager instance
  const fogManager = ref(new FogManager());

  /**
   * Get fog state for a tile
   */
  function getFogState(playerId: PlayerId, tileKey: TileKey): FogState {
    return fogManager.value.getFogState(playerId, tileKey);
  }

  /**
   * Check if tile is explored
   */
  function isExplored(playerId: PlayerId, tileKey: TileKey): boolean {
    return fogManager.value.isExplored(playerId, tileKey);
  }

  /**
   * Check if tile is visible
   */
  function isVisible(playerId: PlayerId, tileKey: TileKey): boolean {
    return fogManager.value.isVisible(playerId, tileKey);
  }

  /**
   * Get last seen snapshot for a tile
   */
  function getLastSeenState(playerId: PlayerId, tileKey: TileKey): TileSnapshot | null {
    return fogManager.value.getSnapshot(playerId, tileKey);
  }

  /**
   * Get all explored tiles for a player
   */
  function getExploredTiles(playerId: PlayerId): TileKey[] {
    return fogManager.value.getExploredTiles(playerId);
  }

  /**
   * Get all visible tiles for a player
   */
  function getVisibleTiles(playerId: PlayerId): TileKey[] {
    return fogManager.value.getVisibleTiles(playerId);
  }

  /**
   * Get exploration statistics for a player
   */
  function getExplorationStats(playerId: PlayerId) {
    return fogManager.value.getExplorationStats(playerId);
  }

  /**
   * Clear exploration data for a player
   */
  function clearPlayerExploration(playerId: PlayerId): void {
    fogManager.value.clearPlayerFog(playerId);
  }

  /**
   * Clear all exploration data
   */
  function clearAllExploration(): void {
    fogManager.value.clearAllFog();
  }

  /**
   * Reset exploration store (new game)
   */
  function reset(): void {
    fogManager.value = new FogManager();
  }

  /**
   * Get fog manager (for internal use by game engine)
   */
  function getFogManager() {
    return fogManager.value as FogManager;
  }

  /**
   * Recalculate vision immediately for a player
   * (Used for real-time updates, not just turn-end)
   */
  async function recalculateVisionNow(playerId: PlayerId): Promise<void> {
    const { useBuildingsStore } = await import('@/stores/game/buildings');
    const { useMapStore } = await import('@/stores/game/map');
    const { useTurnStore } = await import('@/stores/game/turn');
    const { VisionCalculator } = await import('@/game/engine/vision-calculator');
    const { VISION_CONFIG } = await import('@/data/config');
    const buildingsModule = await import('@/data/buildings');
    const ALL_BUILDINGS = buildingsModule.ALL_BUILDINGS;
    type BuildingDefinition = (typeof ALL_BUILDINGS)[number];

    const buildingsStore = useBuildingsStore();
    const mapStore = useMapStore();
    const turnStore = useTurnStore();
    const visionCalculator = new VisionCalculator();

    // Collect vision sources from completed buildings
    const visionSources: any[] = [];
    const playerBuildings = buildingsStore.getPlayerBuildings(playerId);

    for (const building of playerBuildings) {
      // Get building definition for vision radius
      const buildingDef = ALL_BUILDINGS.find((b: BuildingDefinition) => b.id === building.buildingId);
      if (!buildingDef) continue;

      const visionSource = visionCalculator.createBuildingVisionSource(
        building.entityId,
        building.coordinates,
        buildingDef.visionRadius || VISION_CONFIG.DEFAULT_VISION_RADIUS,
        playerId,
      );
      visionSources.push(visionSource);
    }

    // Calculate vision
    const visionResult = visionCalculator.calculateVision(playerId, visionSources);

    // Get previous vision state
    const previouslyVisible = visionCalculator.getVisibleTiles(playerId);

    // Get all current tiles for snapshot saving
    const currentTiles = new Map();
    for (const tileKey of visionResult.visibleTiles) {
      const tile = mapStore.getTileByKey(tileKey);
      if (tile) {
        currentTiles.set(tileKey, tile);
      }
    }
    for (const tileKey of previouslyVisible) {
      if (!currentTiles.has(tileKey)) {
        const tile = mapStore.getTileByKey(tileKey);
        if (tile) {
          currentTiles.set(tileKey, tile);
        }
      }
    }

    // Update fog of war (reveals new tiles, covers old ones, saves snapshots)
    const fogUpdate = fogManager.value.updateFog(
      playerId,
      visionResult.visibleTiles,
      previouslyVisible,
      currentTiles,
      turnStore.turnNumber,
    );

    // Generate new tiles
    const tilesNeedingGeneration: string[] = [];
    for (const tileKey of visionResult.tilesRequiringGeneration) {
      const existingTile = mapStore.getTileByKey(tileKey);
      if (!existingTile) {
        tilesNeedingGeneration.push(tileKey);
      }
    }

    if (tilesNeedingGeneration.length > 0) {
      mapStore.ensureTilesExist(tilesNeedingGeneration);
    }

    console.log(
      `👁️ Vision recalculated for ${playerId}: ${fogUpdate.revealed.length} tiles revealed, ${visionResult.visibleTiles.size} total visible`,
    );
  }

  /**
   * Serialize exploration store state for saving
   */
  function serialize() {
    console.log('🔍 Serializing exploration/fog state');
    const fogData = fogManager.value.serialize();
    console.log('📊 Fog states count:', fogData.playerFogStates.length);
    return fogData;
  }

  /**
   * Deserialize exploration store state from save data
   */
  function deserialize(data: ReturnType<typeof serialize>): void {
    console.log('🔍 Deserializing exploration/fog state');
    console.log('📦 Restoring fog states for', data.playerFogStates.length, 'players');

    // Create new FogManager
    fogManager.value = new FogManager();

    // Restore fog states using FogManager's deserialize method
    fogManager.value.deserialize(data);

    console.log('✅ Fog states restored');
  }

  return {
    // Query methods
    getFogState,
    isExplored,
    isVisible,
    getLastSeenState,
    getExploredTiles,
    getVisibleTiles,
    getExplorationStats,

    // Mutation methods
    clearPlayerExploration,
    clearAllExploration,
    reset,
    serialize,
    deserialize,

    // Vision calculation
    recalculateVisionNow,

    // Internal
    getFogManager,
  };
});
