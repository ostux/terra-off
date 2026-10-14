/**
 * Wall System Types
 * Wall segments, gates, and wall loop detection
 */

import type { PlayerId, Coordinates, TileKey } from './game.types';

/**
 * Wall material types
 */
export enum WallMaterial {
  WOOD = 'WOOD',
  STONE = 'STONE',
}

/**
 * Wall or gate instance
 */
export interface WallSegment {
  coordinates: Coordinates;
  ownerId: PlayerId;
  material: WallMaterial;
  isGate: boolean;
  level: number;
  health: number; // For combat damage
}

/**
 * Detected wall loop
 */
export interface WallLoop {
  loopId: string;
  ownerId: PlayerId;
  material: WallMaterial;
  wallTiles: TileKey[];
  gateTiles: TileKey[];
  interiorTiles: TileKey[];
  perimeter: number;
  area: number;
  isValid: boolean; // Has at least one gate, all same material
  validationErrors: string[];
}

/**
 * Wall loop detection result
 */
export interface WallLoopDetectionResult {
  loops: WallLoop[];
  invalidLoops: WallLoop[];
  orphanedWalls: TileKey[]; // Wall segments not part of any loop
}

/**
 * Wall connectivity check
 */
export interface WallConnectivity {
  tileKey: TileKey;
  connectedNeighbors: TileKey[];
  isPartOfLoop: boolean;
  loopId?: string;
}
