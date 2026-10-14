/**
 * Tile Manager
 * Memory-efficient tile loading, unloading, and querying
 */

import type { Coordinates, Tile, TileKey, BuildingInstance, EntityId } from '@/data/types';
import { toTileKey, fromTileKey } from '@/data/types';
import { MAP_CONFIG } from '@/data/config';
import { TileGenerator } from '../generation/tile-generator';
import { getManhattanDistance } from './grid-utils';

/**
 * Tile Manager
 * Manages loaded tiles, handles lazy loading and unloading
 */
export class TileManager {
  private tiles: Map<TileKey, Tile>;
  private generator: TileGenerator;
  private maxLoadedTiles: number;

  constructor(seed: string, maxLoadedTiles = MAP_CONFIG.MAX_LOADED_TILES) {
    this.tiles = new Map();
    this.generator = new TileGenerator(seed);
    this.maxLoadedTiles = maxLoadedTiles;
  }

  /**
   * Get tile at coordinates (generate if not loaded)
   */
  getTile(coords: Coordinates): Tile {
    const key = toTileKey(coords.x, coords.y);

    let tile = this.tiles.get(key);
    if (!tile) {
      tile = this.generator.generateTile(coords);
      this.tiles.set(key, tile);

      // Check if we need to unload tiles
      this.checkMemoryLimit();
    }

    return tile;
  }

  /**
   * Get tile by key (generate if not loaded)
   */
  getTileByKey(key: TileKey): Tile {
    const coords = fromTileKey(key);
    return this.getTile(coords);
  }

  /**
   * Check if tile is loaded in memory
   */
  isTileLoaded(coords: Coordinates): boolean {
    const key = toTileKey(coords.x, coords.y);
    return this.tiles.has(key);
  }

  /**
   * Load multiple tiles at once
   */
  loadTiles(coordinatesList: Coordinates[]): void {
    for (const coords of coordinatesList) {
      this.getTile(coords); // Will generate if not exists
    }
  }

  /**
   * Ensure tiles exist (generate if needed)
   */
  ensureTilesExist(tileKeys: TileKey[]): void {
    for (const key of tileKeys) {
      this.getTileByKey(key);
    }
  }

  /**
   * Update tile (for building placement, etc.)
   */
  updateTile(coords: Coordinates, updates: Partial<Tile>): void {
    const tile = this.getTile(coords);
    Object.assign(tile, updates);
    tile.lastModified = new Date();
  }

  /**
   * Restore tile from serialized data (for save/load)
   * Unlike updateTile, this completely replaces the tile and preserves dates
   */
  restoreTile(tile: Tile): void {
    const key = toTileKey(tile.coordinates.x, tile.coordinates.y);
    this.tiles.set(key, tile);
  }

  /**
   * Get all currently loaded tiles
   */
  getLoadedTiles(): Tile[] {
    return Array.from(this.tiles.values());
  }

  /**
   * Get loaded tile keys
   */
  getLoadedTileKeys(): TileKey[] {
    return Array.from(this.tiles.keys());
  }

  /**
   * Get number of loaded tiles
   */
  getLoadedTileCount(): number {
    return this.tiles.size;
  }

  /**
   * Unload tiles far from vision centers
   */
  unloadDistantTiles(visionCenters: Coordinates[], maxDistance: number): number {
    const tilesToUnload: TileKey[] = [];

    for (const [key, tile] of this.tiles.entries()) {
      // Don't unload tiles with buildings
      if (tile.building) continue;

      // Check distance from all vision centers
      let isNearVision = false;
      for (const center of visionCenters) {
        if (getManhattanDistance(tile.coordinates, center) <= maxDistance) {
          isNearVision = true;
          break;
        }
      }

      if (!isNearVision) {
        tilesToUnload.push(key);
      }
    }

    // Unload tiles
    for (const key of tilesToUnload) {
      this.tiles.delete(key);
    }

    return tilesToUnload.length;
  }

  /**
   * Check memory limit and unload oldest tiles if needed
   */
  private checkMemoryLimit(): void {
    if (this.tiles.size <= this.maxLoadedTiles) return;

    // Sort tiles by last modified (oldest first)
    const sortedTiles = Array.from(this.tiles.entries()).sort((a, b) => {
      return a[1].lastModified.getTime() - b[1].lastModified.getTime();
    });

    // Unload oldest tiles until under limit
    const tilesToRemove = this.tiles.size - this.maxLoadedTiles;
    for (let i = 0; i < tilesToRemove; i++) {
      const [key, tile] = sortedTiles[i]!;

      // Don't unload tiles with buildings or soldiers
      if (tile.building || tile.soldiers) continue;

      this.tiles.delete(key);
    }
  }

  /**
   * Get tiles in rectangular area
   */
  getTilesInArea(topLeft: Coordinates, bottomRight: Coordinates): Tile[] {
    const tiles: Tile[] = [];

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push(this.getTile({ x, y }));
      }
    }

    return tiles;
  }

  /**
   * Get tiles matching a filter
   */
  queryTiles(predicate: (tile: Tile) => boolean): Tile[] {
    return Array.from(this.tiles.values()).filter(predicate);
  }

  /**
   * Place building on tile
   */
  placeBuilding(coords: Coordinates, building: BuildingInstance): boolean {
    const tile = this.getTile(coords);

    // Validate placement
    if (tile.building !== null) {
      return false; // Tile already occupied
    }

    tile.building = {
      buildingId: building.buildingId,
      ownerId: building.ownerId,
      entityId: building.entityId,
      level: building.level,
      isUnderConstruction: building.isUnderConstruction,
      constructionTurnsRemaining: building.constructionTurnsRemaining,
      peasantsAllocated: 0,
    };

    tile.lastModified = new Date();
    return true;
  }

  /**
   * Remove building from tile
   */
  removeBuilding(coords: Coordinates): boolean {
    const tile = this.getTile(coords);

    if (!tile.building) {
      return false;
    }

    tile.building = null;
    tile.lastModified = new Date();
    return true;
  }

  /**
   * Assign soldiers to tile
   */
  assignSoldiers(coords: Coordinates, unitEntityIds: EntityId[], ownerId: string): boolean {
    const tile = this.getTile(coords);

    // Check if tile can hold soldiers
    if (!tile.building) {
      return false;
    }

    // For now, simple implementation
    tile.soldiers = {
      ownerId,
      units: [],
      totalCount: unitEntityIds.length,
    };

    tile.lastModified = new Date();
    return true;
  }

  /**
   * Clear all loaded tiles (for testing/reset)
   */
  clear(): void {
    this.tiles.clear();
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    let tilesWithBuildings = 0;
    let tilesWithSoldiers = 0;
    let tilesWithResources = 0;

    for (const tile of this.tiles.values()) {
      if (tile.building) tilesWithBuildings++;
      if (tile.soldiers) tilesWithSoldiers++;
      if (tile.resourceDeposit) tilesWithResources++;
    }

    return {
      totalTiles: this.tiles.size,
      maxTiles: this.maxLoadedTiles,
      utilizationPercent: (this.tiles.size / this.maxLoadedTiles) * 100,
      tilesWithBuildings,
      tilesWithSoldiers,
      tilesWithResources,
    };
  }
}
