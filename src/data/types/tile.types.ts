/**
 * Tile System Types
 * Defines map tiles, terrain, and tile state
 */

import type { Coordinates, EntityId, PlayerId } from './game.types';

/**
 * Terrain types for tile generation
 */
export enum TerrainType {
  GRASSLAND = 'GRASSLAND',
  FOREST = 'FOREST',
  MOUNTAIN = 'MOUNTAIN',
  WATER = 'WATER',
  WASTELAND = 'WASTELAND',
  DESERT = 'DESERT',
}

/**
 * Resource deposit types on tiles
 */
export enum ResourceDepositType {
  FOOD = 'FOOD', // Fertile soil, berries
  WOOD = 'WOOD', // Dense forest
  STONE = 'STONE', // Rocky outcrop
  IRON = 'IRON', // Iron ore
}

/**
 * Resource deposit on a tile
 */
export interface ResourceDeposit {
  type: ResourceDepositType;
  richness: number; // 1-3 (poor, normal, rich)
  depleted: boolean; // If resource has been exhausted
}

/**
 * Building on a tile
 */
export interface TileBuilding {
  buildingId: string; // Reference to building definition
  ownerId: PlayerId;
  entityId: EntityId; // Unique instance ID
  level: number; // Building upgrade level
  isUnderConstruction: boolean;
  constructionTurnsRemaining: number;
  peasantsAllocated: number;
}

/**
 * Soldiers stationed on a tile
 */
export interface TileSoldiers {
  ownerId: PlayerId;
  units: TileUnitGroup[];
  totalCount: number;
}

/**
 * Group of units of same type on tile
 */
export interface TileUnitGroup {
  unitId: string; // Reference to unit definition
  entityIds: EntityId[]; // Individual unit instances
  count: number;
}

/**
 * Complete tile state
 */
export interface Tile {
  coordinates: Coordinates;
  terrain: TerrainType;
  resourceDeposit: ResourceDeposit | null;
  building: TileBuilding | null;
  soldiers: TileSoldiers | null;

  // Metadata
  generatedAt: Date;
  lastModified: Date;
}

/**
 * Tile snapshot for fog of war (last seen state)
 */
export interface TileSnapshot {
  coordinates: Coordinates;
  terrain: TerrainType;
  resourceDeposit: ResourceDeposit | null;
  building: TileBuilding | null;
  soldiers: TileSoldiers | null;
  snapshotTurnNumber: number;
}

/**
 * Tile query filters
 */
export interface TileQueryFilter {
  terrain?: TerrainType[];
  hasResource?: boolean;
  hasBuilding?: boolean;
  ownerId?: PlayerId;
  inRadius?: {
    center: Coordinates;
    radius: number;
  };
}

/**
 * Buildability check result
 */
export interface BuildabilityCheck {
  canBuild: boolean;
  reason?: string;
  terrain: TerrainType;
  hasExistingBuilding: boolean;
  hasResourceDeposit: boolean;
}
