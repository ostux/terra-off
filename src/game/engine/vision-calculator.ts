/**
 * Vision Calculation Engine
 * Calculates visible tiles for players based on buildings and units
 */

import type {
  PlayerId,
  TileKey,
  VisionSource,
  VisionCalculationResult,
  Coordinates,
} from '@/data/types';
import { VisionSourceType } from '@/data/types';
import { VISION_CONFIG } from '@/data/config';
import { getTilesInRadius } from './grid-utils';

/**
 * Vision Calculator
 * Manages vision calculation for players
 */
export class VisionCalculator {
  private visionCache: Map<PlayerId, Set<TileKey>>;

  constructor() {
    this.visionCache = new Map();
  }

  /**
   * Calculate all visible tiles for a player
   */
  calculateVision(playerId: PlayerId, visionSources: VisionSource[]): VisionCalculationResult {
    const previouslyVisible = this.visionCache.get(playerId) || new Set<TileKey>();
    const currentlyVisible = new Set<TileKey>();

    // Collect all tiles visible from all sources
    for (const source of visionSources) {
      const visibleTiles = getTilesInRadius(source.coordinates, source.visionRadius);

      for (const tileKey of visibleTiles) {
        currentlyVisible.add(tileKey);
      }
    }

    // Determine newly visible and no longer visible tiles
    const newlyVisible: TileKey[] = [];
    const noLongerVisible: TileKey[] = [];

    for (const tileKey of currentlyVisible) {
      if (!previouslyVisible.has(tileKey)) {
        newlyVisible.push(tileKey);
      }
    }

    for (const tileKey of previouslyVisible) {
      if (!currentlyVisible.has(tileKey)) {
        noLongerVisible.push(tileKey);
      }
    }

    // Tiles requiring generation (newly visible + buffer)
    const tilesRequiringGeneration = this.calculateTilesRequiringGeneration(
      currentlyVisible,
      visionSources,
    );

    // Update cache
    this.visionCache.set(playerId, currentlyVisible);

    return {
      playerId,
      visibleTiles: currentlyVisible,
      newlyVisible,
      noLongerVisible,
      tilesRequiringGeneration,
    };
  }

  /**
   * Calculate which tiles need to be generated
   * Includes visible tiles + buffer zone
   */
  private calculateTilesRequiringGeneration(
    visibleTiles: Set<TileKey>,
    visionSources: VisionSource[],
  ): TileKey[] {
    const generationSet = new Set<TileKey>();

    // Add all visible tiles
    for (const tileKey of visibleTiles) {
      generationSet.add(tileKey);
    }

    // Add buffer zone around vision sources
    const bufferDistance = VISION_CONFIG.TILE_GENERATION_BUFFER;

    for (const source of visionSources) {
      const bufferTiles = getTilesInRadius(
        source.coordinates,
        source.visionRadius + bufferDistance,
      );

      for (const tileKey of bufferTiles) {
        generationSet.add(tileKey);
      }
    }

    return Array.from(generationSet);
  }

  /**
   * Get vision sources from buildings
   */
  createBuildingVisionSource(
    buildingEntityId: string,
    coordinates: Coordinates,
    visionRadius: number,
    ownerId: PlayerId,
  ): VisionSource {
    return {
      sourceType: VisionSourceType.BUILDING,
      sourceId: buildingEntityId,
      coordinates,
      visionRadius,
      ownerId,
    };
  }

  /**
   * Get vision sources from units
   */
  createUnitVisionSource(
    unitEntityId: string,
    coordinates: Coordinates,
    visionRadius: number,
    ownerId: PlayerId,
  ): VisionSource {
    return {
      sourceType: VisionSourceType.UNIT,
      sourceId: unitEntityId,
      coordinates,
      visionRadius,
      ownerId,
    };
  }

  /**
   * Check if a tile is visible to a player
   */
  isTileVisible(playerId: PlayerId, tileKey: TileKey): boolean {
    const visibleTiles = this.visionCache.get(playerId);
    return visibleTiles ? visibleTiles.has(tileKey) : false;
  }

  /**
   * Get all visible tiles for a player (cached)
   */
  getVisibleTiles(playerId: PlayerId): Set<TileKey> {
    return this.visionCache.get(playerId) || new Set();
  }

  /**
   * Clear vision cache for a player
   */
  clearPlayerVision(playerId: PlayerId): void {
    this.visionCache.delete(playerId);
  }

  /**
   * Clear all vision cache
   */
  clearAllVision(): void {
    this.visionCache.clear();
  }

  /**
   * Get vision statistics for a player
   */
  getVisionStats(playerId: PlayerId) {
    const visibleTiles = this.visionCache.get(playerId);

    return {
      visibleTileCount: visibleTiles ? visibleTiles.size : 0,
      hasCachedVision: this.visionCache.has(playerId),
    };
  }

  /**
   * Calculate vision coverage area (for statistics)
   */
  calculateVisionCoverage(visionSources: VisionSource[]): number {
    const allVisibleTiles = new Set<TileKey>();

    for (const source of visionSources) {
      const visibleTiles = getTilesInRadius(source.coordinates, source.visionRadius);
      for (const tileKey of visibleTiles) {
        allVisibleTiles.add(tileKey);
      }
    }

    return allVisibleTiles.size;
  }
}
