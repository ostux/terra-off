/**
 * Wall Manager
 * Handles wall and gate placement, validation, and tracking
 */

import type {
  Coordinates,
  TileKey,
  PlayerId,
  WallSegment,
  Tile,
} from '@/data/types';
import { toTileKey, WallMaterial } from '@/data/types';
import { getBuildingById } from '@/data/buildings';

/**
 * Wall placement validation result
 */
export interface WallPlacementValidation {
  canPlace: boolean;
  reason?: string;
}

/**
 * Gate placement validation result
 */
export interface GatePlacementValidation {
  canPlace: boolean;
  reason?: string;
  replacesWall: boolean;
  wallMaterial?: WallMaterial;
}

/**
 * Wall Manager - Handles wall and gate placement logic
 */
export class WallManager {
  private walls: Map<TileKey, WallSegment> = new Map();
  private gates: Map<TileKey, WallSegment> = new Map();

  /**
   * Validate wall placement on a tile
   */
  validateWallPlacement(
    tile: Tile,
    wallBuildingId: string,
    ownerId: PlayerId,
  ): WallPlacementValidation {
    const wallDef = getBuildingById(wallBuildingId);

    if (!wallDef || !wallDef.isWall) {
      return {
        canPlace: false,
        reason: 'Invalid wall building type',
      };
    }

    // Cannot place walls on resource deposits
    if (tile.resourceDeposit && !tile.resourceDeposit.depleted) {
      return {
        canPlace: false,
        reason: 'Cannot place walls on resource deposits',
      };
    }

    // Tile must be empty OR have an existing wall (upgrade/replace scenario)
    if (tile.building) {
      const existingBuilding = getBuildingById(tile.building.buildingId);

      // Allow replacing wood wall with stone wall (upgrade)
      if (existingBuilding?.isWall) {
        if (tile.building.ownerId !== ownerId) {
          return {
            canPlace: false,
            reason: 'Cannot replace another player\'s wall',
          };
        }

        // Can upgrade from wood to stone
        if (existingBuilding.wallMaterial === 'WOOD' && wallDef.wallMaterial === 'STONE') {
          return { canPlace: true };
        }

        // Cannot downgrade from stone to wood
        if (existingBuilding.wallMaterial === 'STONE' && wallDef.wallMaterial === 'WOOD') {
          return {
            canPlace: false,
            reason: 'Cannot downgrade stone wall to wood',
          };
        }

        // Same material - replace
        return { canPlace: true };
      }

      // Cannot replace non-wall buildings
      return {
        canPlace: false,
        reason: 'Tile already has a building',
      };
    }

    return { canPlace: true };
  }

  /**
   * Validate gate placement on a tile
   */
  validateGatePlacement(
    tile: Tile,
    gateBuildingId: string,
    ownerId: PlayerId,
  ): GatePlacementValidation {
    const gateDef = getBuildingById(gateBuildingId);

    if (!gateDef || !gateDef.isGate) {
      return {
        canPlace: false,
        replacesWall: false,
        reason: 'Invalid gate building type',
      };
    }

    // Gates should be placed on or adjacent to walls
    // For now, allow placement on empty tiles or walls
    if (tile.building) {
      const existingBuilding = getBuildingById(tile.building.buildingId);

      // Gate can replace a wall of same or lower material
      if (existingBuilding?.isWall) {
        if (tile.building.ownerId !== ownerId) {
          return {
            canPlace: false,
            replacesWall: false,
            reason: 'Cannot replace another player\'s wall with gate',
          };
        }

        // Gate material must match or upgrade wall material
        if (existingBuilding.wallMaterial === 'STONE' && gateDef.wallMaterial === 'WOOD') {
          return {
            canPlace: false,
            replacesWall: false,
            reason: 'Cannot place wood gate on stone wall',
          };
        }

        return {
          canPlace: true,
          replacesWall: true,
          wallMaterial: (existingBuilding.wallMaterial === 'WOOD'
            ? WallMaterial.WOOD
            : WallMaterial.STONE) as WallMaterial,
        };
      }

      // Gate cannot replace non-wall buildings
      if (existingBuilding?.isGate) {
        return {
          canPlace: false,
          replacesWall: false,
          reason: 'Tile already has a gate',
        };
      }

      return {
        canPlace: false,
        replacesWall: false,
        reason: 'Gates can only be placed on walls or empty tiles',
      };
    }

    // Allow placing gate on empty tile (will connect to walls)
    return {
      canPlace: true,
      replacesWall: false,
    };
  }

  /**
   * Register a wall segment
   */
  registerWall(coords: Coordinates, ownerId: PlayerId, material: WallMaterial, level = 1): void {
    const key = toTileKey(coords.x, coords.y);
    this.walls.set(key, {
      coordinates: coords,
      ownerId,
      material,
      isGate: false,
      level,
      health: 100,
    });
  }

  /**
   * Register a gate segment
   */
  registerGate(coords: Coordinates, ownerId: PlayerId, material: WallMaterial, level = 1): void {
    const key = toTileKey(coords.x, coords.y);

    // Remove from walls if it was there (gate replaces wall)
    this.walls.delete(key);

    this.gates.set(key, {
      coordinates: coords,
      ownerId,
      material,
      isGate: true,
      level,
      health: 100,
    });
  }

  /**
   * Remove wall or gate at coordinates
   */
  removeWallOrGate(coords: Coordinates): boolean {
    const key = toTileKey(coords.x, coords.y);
    const wasWall = this.walls.delete(key);
    const wasGate = this.gates.delete(key);
    return wasWall || wasGate;
  }

  /**
   * Get wall segment at coordinates
   */
  getWall(coords: Coordinates): WallSegment | undefined {
    return this.walls.get(toTileKey(coords.x, coords.y));
  }

  /**
   * Get gate segment at coordinates
   */
  getGate(coords: Coordinates): WallSegment | undefined {
    return this.gates.get(toTileKey(coords.x, coords.y));
  }

  /**
   * Get wall or gate at coordinates
   */
  getWallOrGate(coords: Coordinates): WallSegment | undefined {
    const key = toTileKey(coords.x, coords.y);
    return this.walls.get(key) || this.gates.get(key);
  }

  /**
   * Check if tile has a wall (not gate)
   */
  hasWall(coords: Coordinates): boolean {
    return this.walls.has(toTileKey(coords.x, coords.y));
  }

  /**
   * Check if tile has a gate
   */
  hasGate(coords: Coordinates): boolean {
    return this.gates.has(toTileKey(coords.x, coords.y));
  }

  /**
   * Check if tile has wall or gate
   */
  hasWallOrGate(coords: Coordinates): boolean {
    const key = toTileKey(coords.x, coords.y);
    return this.walls.has(key) || this.gates.has(key);
  }

  /**
   * Get all walls
   */
  getAllWalls(): Map<TileKey, WallSegment> {
    return new Map(this.walls);
  }

  /**
   * Get all gates
   */
  getAllGates(): Map<TileKey, WallSegment> {
    return new Map(this.gates);
  }

  /**
   * Get all walls for a specific player
   */
  getPlayerWalls(playerId: PlayerId): WallSegment[] {
    return Array.from(this.walls.values()).filter((wall) => wall.ownerId === playerId);
  }

  /**
   * Get all gates for a specific player
   */
  getPlayerGates(playerId: PlayerId): WallSegment[] {
    return Array.from(this.gates.values()).filter((gate) => gate.ownerId === playerId);
  }

  /**
   * Get all wall and gate keys (for loop detection)
   */
  getAllWallAndGateKeys(): TileKey[] {
    return [...this.walls.keys(), ...this.gates.keys()];
  }

  /**
   * Clear all walls and gates (for testing)
   */
  clear(): void {
    this.walls.clear();
    this.gates.clear();
  }
}
