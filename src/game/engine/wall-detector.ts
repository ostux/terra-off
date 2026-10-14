/**
 * Wall Loop Detector
 * Detects closed loops of walls and gates using flood-fill algorithm
 */

import type { Coordinates, TileKey, WallLoop, WallLoopDetectionResult } from '@/data/types';
import { toTileKey, fromTileKey } from '@/data/types';
import { getCardinalNeighbors } from './grid-utils';
import type { WallManager } from './wall-manager';

/**
 * Wall Loop Detector
 * Uses flood-fill algorithm to detect wall loops
 */
export class WallDetector {
  private wallManager: WallManager;

  constructor(wallManager: WallManager) {
    this.wallManager = wallManager;
  }

  /**
   * Detect all wall loops on the map
   * Uses flood-fill approach: areas not reachable from outside are interior
   */
  detectAllLoops(
    mapBounds: { minX: number; minY: number; maxX: number; maxY: number },
  ): WallLoopDetectionResult {
    const loops: WallLoop[] = [];
    const invalidLoops: WallLoop[] = [];

    // Get all wall and gate tiles
    const wallAndGateTiles = new Set(this.wallManager.getAllWallAndGateKeys());

    if (wallAndGateTiles.size === 0) {
      return { loops: [], invalidLoops: [], orphanedWalls: [] };
    }

    // Find all enclosed regions by flood-filling from outside
    const exteriorTiles = this.floodFillExterior(mapBounds, wallAndGateTiles);

    // Any tiles within bounds that are NOT exterior and NOT walls are interior
    const interiorRegions = this.findInteriorRegions(mapBounds, wallAndGateTiles, exteriorTiles);

    // For each interior region, find its enclosing walls
    for (const region of interiorRegions) {
      const loop = this.buildLoopFromInterior(region, wallAndGateTiles);

      if (loop) {
        if (loop.isValid) {
          loops.push(loop);
        } else {
          invalidLoops.push(loop);
        }
      }
    }

    // Find orphaned walls (walls not part of any loop)
    const wallsInLoops = new Set<TileKey>();
    [...loops, ...invalidLoops].forEach((loop) => {
      loop.wallTiles.forEach((tile) => wallsInLoops.add(tile));
      loop.gateTiles.forEach((tile) => wallsInLoops.add(tile));
    });

    const orphanedWalls = Array.from(wallAndGateTiles).filter((tile) => !wallsInLoops.has(tile));

    return { loops, invalidLoops, orphanedWalls };
  }

  /**
   * Flood-fill from outside the map bounds to find all exterior tiles
   */
  private floodFillExterior(
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    wallTiles: Set<TileKey>,
  ): Set<TileKey> {
    const exterior = new Set<TileKey>();
    const queue: Coordinates[] = [];

    // Add a buffer around bounds for flood-fill starting point
    const bufferSize = 2;
    const startX = bounds.minX - bufferSize;
    const startY = bounds.minY - bufferSize;
    const endX = bounds.maxX + bufferSize;
    const endY = bounds.maxY + bufferSize;

    // Start flood-fill from outside top-left corner
    const start: Coordinates = { x: startX, y: startY };
    queue.push(start);
    exterior.add(toTileKey(start.x, start.y));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = getCardinalNeighbors(current);

      for (const neighbor of neighbors) {
        const key = toTileKey(neighbor.x, neighbor.y);

        // Skip if already visited
        if (exterior.has(key)) continue;

        // Skip if out of flood-fill bounds
        if (
          neighbor.x < startX ||
          neighbor.x > endX ||
          neighbor.y < startY ||
          neighbor.y > endY
        ) {
          continue;
        }

        // Skip if this is a wall (walls block flood-fill)
        if (wallTiles.has(key)) continue;

        // Mark as exterior and continue flood-fill
        exterior.add(key);
        queue.push(neighbor);
      }
    }

    return exterior;
  }

  /**
   * Find all interior regions (tiles not reachable from exterior)
   */
  private findInteriorRegions(
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    wallTiles: Set<TileKey>,
    exteriorTiles: Set<TileKey>,
  ): Set<TileKey>[] {
    const regions: Set<TileKey>[] = [];
    const visited = new Set<TileKey>();

    // Check all tiles within bounds
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        const coords = { x, y };
        const key = toTileKey(coords.x, coords.y);

        // Skip if already visited, is exterior, or is a wall
        if (visited.has(key) || exteriorTiles.has(key) || wallTiles.has(key)) {
          continue;
        }

        // Found an interior tile - flood-fill to get entire region
        const region = this.floodFillInteriorRegion(coords, wallTiles, exteriorTiles, visited);

        if (region.size > 0) {
          regions.push(region);
        }
      }
    }

    return regions;
  }

  /**
   * Flood-fill a single interior region
   */
  private floodFillInteriorRegion(
    start: Coordinates,
    wallTiles: Set<TileKey>,
    exteriorTiles: Set<TileKey>,
    globalVisited: Set<TileKey>,
  ): Set<TileKey> {
    const region = new Set<TileKey>();
    const queue: Coordinates[] = [start];
    const localVisited = new Set<TileKey>();
    localVisited.add(toTileKey(start.x, start.y));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = toTileKey(current.x, current.y);

      region.add(key);
      globalVisited.add(key);

      const neighbors = getCardinalNeighbors(current);

      for (const neighbor of neighbors) {
        const neighborKey = toTileKey(neighbor.x, neighbor.y);

        // Skip if already visited in this flood-fill
        if (localVisited.has(neighborKey)) continue;

        // Skip if exterior or wall
        if (exteriorTiles.has(neighborKey) || wallTiles.has(neighborKey)) continue;

        localVisited.add(neighborKey);
        queue.push(neighbor);
      }
    }

    return region;
  }

  /**
   * Build a WallLoop from an interior region
   */
  private buildLoopFromInterior(
    interiorTiles: Set<TileKey>,
    allWallTiles: Set<TileKey>,
  ): WallLoop | null {
    if (interiorTiles.size === 0) return null;

    // Find all walls adjacent to this interior region
    const enclosingWalls = new Set<TileKey>();
    const enclosingGates = new Set<TileKey>();

    for (const interiorKey of interiorTiles) {
      const coords = fromTileKey(interiorKey);
      const neighbors = getCardinalNeighbors(coords);

      for (const neighbor of neighbors) {
        const neighborKey = toTileKey(neighbor.x, neighbor.y);

        if (allWallTiles.has(neighborKey)) {
          const segment = this.wallManager.getWallOrGate(neighbor);

          if (segment) {
            if (segment.isGate) {
              enclosingGates.add(neighborKey);
            } else {
              enclosingWalls.add(neighborKey);
            }
          }
        }
      }
    }

    if (enclosingWalls.size === 0 && enclosingGates.size === 0) {
      return null;
    }

    // Get first wall/gate to determine owner and material
    const firstKey =
      (enclosingWalls.values().next().value as TileKey | undefined) ||
      (enclosingGates.values().next().value as TileKey | undefined);
    if (!firstKey) return null;

    const firstSegment = this.wallManager.getWallOrGate(fromTileKey(firstKey));

    if (!firstSegment) return null;

    const ownerId = firstSegment.ownerId;
    const material = firstSegment.material;

    // Validate loop
    const validationErrors: string[] = [];
    let isValid = true;

    // Must have at least one gate
    if (enclosingGates.size === 0) {
      validationErrors.push('Loop must have at least one gate');
      isValid = false;
    }

    // All walls and gates must be same owner
    for (const wallKey of enclosingWalls) {
      const wall = this.wallManager.getWall(fromTileKey(wallKey));
      if (wall && wall.ownerId !== ownerId) {
        validationErrors.push('All walls in loop must have same owner');
        isValid = false;
        break;
      }
    }

    for (const gateKey of enclosingGates) {
      const gate = this.wallManager.getGate(fromTileKey(gateKey));
      if (gate && gate.ownerId !== ownerId) {
        validationErrors.push('All gates in loop must have same owner');
        isValid = false;
        break;
      }
    }

    // All walls and gates should be same material (for village/city classification)
    for (const wallKey of enclosingWalls) {
      const wall = this.wallManager.getWall(fromTileKey(wallKey));
      if (wall && wall.material !== material) {
        validationErrors.push('Mixed wall materials in loop (wood and stone)');
        isValid = false;
        break;
      }
    }

    for (const gateKey of enclosingGates) {
      const gate = this.wallManager.getGate(fromTileKey(gateKey));
      if (gate && gate.material !== material) {
        validationErrors.push('Mixed wall materials in loop (wood and stone)');
        isValid = false;
        break;
      }
    }

    // Calculate perimeter and area
    const perimeter = enclosingWalls.size + enclosingGates.size;
    const area = interiorTiles.size;

    // Generate unique loop ID
    const sortedInterior = Array.from(interiorTiles).sort();
    const loopId = `loop-${ownerId}-${sortedInterior[0]}`;

    return {
      loopId,
      ownerId,
      material,
      wallTiles: Array.from(enclosingWalls),
      gateTiles: Array.from(enclosingGates),
      interiorTiles: Array.from(interiorTiles),
      perimeter,
      area,
      isValid,
      validationErrors,
    };
  }

  /**
   * Check if a specific tile is part of any wall loop
   */
  isTileInLoop(coords: Coordinates, loops: WallLoop[]): boolean {
    const key = toTileKey(coords.x, coords.y);
    return loops.some(
      (loop) =>
        loop.wallTiles.includes(key) ||
        loop.gateTiles.includes(key) ||
        loop.interiorTiles.includes(key),
    );
  }

  /**
   * Get loop containing a specific tile
   */
  getLoopContainingTile(coords: Coordinates, loops: WallLoop[]): WallLoop | null {
    const key = toTileKey(coords.x, coords.y);
    return (
      loops.find(
        (loop) =>
          loop.wallTiles.includes(key) ||
          loop.gateTiles.includes(key) ||
          loop.interiorTiles.includes(key),
      ) || null
    );
  }
}
