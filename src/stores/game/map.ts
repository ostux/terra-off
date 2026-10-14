/**
 * Map Store
 * Dynamic map state with on-demand tile generation
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Coordinates, Tile, TileKey, BuildingInstance, EntityId } from '@/data/types';
import { toTileKey } from '@/data/types';
import { TileManager } from '@/game/engine/tile-manager';
import { MAP_CONFIG } from '@/data/config';

export const useMapStore = defineStore('map', () => {
  // Map seed for deterministic generation
  const mapSeed = ref<string>('');

  // Tile manager instance
  const tileManager = ref<TileManager | null>(null);

  /**
   * Initialize map with seed
   */
  function initializeMap(seed: string): void {
    mapSeed.value = seed;
    tileManager.value = new TileManager(seed, MAP_CONFIG.MAX_LOADED_TILES);
  }

  /**
   * Get tile at coordinates
   */
  function getTile(coords: Coordinates): Tile | null {
    if (!tileManager.value) return null;
    return tileManager.value.getTile(coords);
  }

  /**
   * Get tile by key
   */
  function getTileByKey(key: TileKey): Tile | null {
    if (!tileManager.value) return null;
    return tileManager.value.getTileByKey(key);
  }

  /**
   * Check if tile is loaded
   */
  function isTileLoaded(coords: Coordinates): boolean {
    if (!tileManager.value) return false;
    return tileManager.value.isTileLoaded(coords);
  }

  /**
   * Load multiple tiles
   */
  function loadTiles(coordinatesList: Coordinates[]): void {
    if (!tileManager.value) return;
    tileManager.value.loadTiles(coordinatesList);
  }

  /**
   * Ensure tiles exist (generate if needed)
   */
  function ensureTilesExist(tileKeys: TileKey[]): void {
    if (!tileManager.value) return;
    tileManager.value.ensureTilesExist(tileKeys);
  }

  /**
   * Update tile
   */
  function updateTile(coords: Coordinates, updates: Partial<Tile>): void {
    if (!tileManager.value) return;
    tileManager.value.updateTile(coords, updates);
  }

  /**
   * Get all loaded tiles
   */
  function getLoadedTiles(): Tile[] {
    if (!tileManager.value) return [];
    return tileManager.value.getLoadedTiles();
  }

  /**
   * Get loaded tile keys
   */
  function getLoadedTileKeys(): TileKey[] {
    if (!tileManager.value) return [];
    return tileManager.value.getLoadedTileKeys();
  }

  /**
   * Get number of loaded tiles
   */
  function getLoadedTileCount(): number {
    if (!tileManager.value) return 0;
    return tileManager.value.getLoadedTileCount();
  }

  /**
   * Unload distant tiles
   */
  function unloadDistantTiles(visionCenters: Coordinates[], maxDistance: number): number {
    if (!tileManager.value) return 0;
    return tileManager.value.unloadDistantTiles(visionCenters, maxDistance);
  }

  /**
   * Get tiles in area
   */
  function getTilesInArea(topLeft: Coordinates, bottomRight: Coordinates): Tile[] {
    if (!tileManager.value) return [];
    return tileManager.value.getTilesInArea(topLeft, bottomRight);
  }

  /**
   * Query tiles
   */
  function queryTiles(predicate: (tile: Tile) => boolean): Tile[] {
    if (!tileManager.value) return [];
    return tileManager.value.queryTiles(predicate);
  }

  /**
   * Place building on tile
   */
  function placeBuilding(coords: Coordinates, building: BuildingInstance): boolean {
    if (!tileManager.value) return false;
    return tileManager.value.placeBuilding(coords, building);
  }

  /**
   * Remove building from tile
   */
  function removeBuilding(coords: Coordinates): boolean {
    if (!tileManager.value) return false;
    return tileManager.value.removeBuilding(coords);
  }

  /**
   * Assign soldiers to tile
   */
  function assignSoldiers(
    coords: Coordinates,
    unitEntityIds: EntityId[],
    ownerId: string,
  ): boolean {
    if (!tileManager.value) return false;
    return tileManager.value.assignSoldiers(coords, unitEntityIds, ownerId);
  }

  /**
   * Get memory statistics
   */
  function getMemoryStats() {
    if (!tileManager.value) {
      return {
        totalTiles: 0,
        maxTiles: 0,
        utilizationPercent: 0,
        tilesWithBuildings: 0,
        tilesWithSoldiers: 0,
        tilesWithResources: 0,
      };
    }
    return tileManager.value.getMemoryStats();
  }

  /**
   * Clear all tiles
   */
  function clearTiles(): void {
    if (!tileManager.value) return;
    tileManager.value.clear();
  }

  /**
   * Reset map store (new game)
   */
  function reset(): void {
    mapSeed.value = '';
    tileManager.value = null;
  }

  /**
   * Get tile manager (for internal use)
   */
  function getTileManager() {
    return tileManager.value as TileManager | null;
  }

  /**
   * Serialize map store state for saving
   */
  function serialize() {
    if (!tileManager.value) {
      return {
        mapSeed: mapSeed.value,
        loadedTiles: [],
      };
    }

    const loadedTiles = tileManager.value.getLoadedTiles().map((tile) => ({
      key: toTileKey(tile.coordinates.x, tile.coordinates.y),
      data: {
        coordinates: tile.coordinates,
        terrain: tile.terrain,
        resourceDeposit: tile.resourceDeposit,
        building: tile.building,
        soldiers: tile.soldiers,
        generatedAt: tile.generatedAt.toISOString(),
        lastModified: tile.lastModified.toISOString(),
      },
    }));

    console.log(`🗺️ Serializing ${loadedTiles.length} tiles`);
    if (loadedTiles.length > 0) {
      console.log('📍 Sample tile:', loadedTiles[0]);
    }

    return {
      mapSeed: mapSeed.value,
      loadedTiles,
    };
  }

  /**
   * Deserialize map store state from save data
   */
  function deserialize(data: ReturnType<typeof serialize>): void {
    console.log('🗺️ Deserializing map with seed:', data.mapSeed);
    console.log('📦 Restoring', data.loadedTiles.length, 'tiles');

    mapSeed.value = data.mapSeed;

    if (!data.mapSeed) {
      tileManager.value = null;
      return;
    }

    // Recreate tile manager with seed
    tileManager.value = new TileManager(data.mapSeed, MAP_CONFIG.MAX_LOADED_TILES);

    // Restore loaded tiles
    for (const { data: tileData } of data.loadedTiles) {
      // Reconstruct tile with proper Date objects
      const tile: Tile = {
        coordinates: tileData.coordinates,
        terrain: tileData.terrain,
        resourceDeposit: tileData.resourceDeposit,
        building: tileData.building,
        soldiers: tileData.soldiers,
        generatedAt: new Date(tileData.generatedAt),
        lastModified: new Date(tileData.lastModified),
      };

      // Use restoreTile to directly set the tile without regenerating
      tileManager.value.restoreTile(tile);
    }

    console.log('✅ Map deserialized:', tileManager.value.getLoadedTileCount(), 'tiles loaded');
    if (data.loadedTiles.length > 0 && data.loadedTiles[0]) {
      const firstTile = tileManager.value.getTile(data.loadedTiles[0].data.coordinates);
      console.log('📍 Sample restored tile:', firstTile);
    }
  }

  return {
    // State
    mapSeed: computed(() => mapSeed.value),
    loadedTileCount: computed(() => getLoadedTileCount()),
    memoryStats: computed(() => getMemoryStats()),

    // Initialization
    initializeMap,

    // Tile access
    getTile,
    getTileByKey,
    isTileLoaded,
    loadTiles,
    ensureTilesExist,

    // Tile modification
    updateTile,
    placeBuilding,
    removeBuilding,
    assignSoldiers,

    // Queries
    getLoadedTiles,
    getLoadedTileKeys,
    getTilesInArea,
    queryTiles,

    // Memory management
    unloadDistantTiles,

    // Utilities
    clearTiles,
    reset,
    serialize,
    deserialize,

    // Internal
    getTileManager,
  };
});
