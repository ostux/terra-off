/**
 * Vision System Types
 * Manages player vision, exploration, and vision sources
 */

import type { PlayerId, Coordinates, TileKey, EntityId } from './game.types';

/**
 * Types of entities that provide vision
 */
export enum VisionSourceType {
  BUILDING = 'BUILDING',
  UNIT = 'UNIT',
}

/**
 * Vision source (building or unit)
 */
export interface VisionSource {
  sourceType: VisionSourceType;
  sourceId: EntityId;
  coordinates: Coordinates;
  visionRadius: number;
  ownerId: PlayerId;
}

/**
 * Per-player vision state
 */
export interface PlayerVisionState {
  playerId: PlayerId;
  visionSources: VisionSource[];
  visibleTiles: Set<TileKey>;
  visionDirty: boolean; // Needs recalculation?
  lastCalculatedTurn: number;
}

/**
 * Vision calculation result
 */
export interface VisionCalculationResult {
  playerId: PlayerId;
  visibleTiles: Set<TileKey>;
  newlyVisible: TileKey[]; // Tiles that became visible this calculation
  noLongerVisible: TileKey[]; // Tiles that lost visibility
  tilesRequiringGeneration: TileKey[]; // Tiles that need to be generated
}

/**
 * Vision radius configuration per entity
 */
export interface VisionRadiusConfig {
  entityId: string; // Building or unit ID
  baseRadius: number;
  bonusRadius?: number; // From upgrades/research
}

/**
 * Exploration statistics for player
 */
export interface ExplorationStats {
  playerId: PlayerId;
  tilesExplored: number;
  tilesCurrentlyVisible: number;
  percentageExplored: number; // Of some reference area
  visionSourceCount: number;
}
