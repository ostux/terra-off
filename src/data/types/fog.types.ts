/**
 * Fog of War Types
 * Two-layer fog system: unexplored (black) and explored (grey)
 */

import type { PlayerId, TileKey } from './game.types';
import type { TileSnapshot } from './tile.types';

/**
 * Fog of war states
 */
export enum FogState {
  UNEXPLORED = 'UNEXPLORED', // Never seen before (black fog)
  EXPLORED = 'EXPLORED', // Previously visible, not currently (grey fog, shows last seen state)
  VISIBLE = 'VISIBLE', // Currently visible (no fog)
}

/**
 * Fog state for a single tile
 */
export interface TileFogState {
  tileKey: TileKey;
  state: FogState;
  lastSeenTurn?: number; // When was this tile last visible?
  lastSeenSnapshot?: TileSnapshot; // What did it look like when last seen?
}

/**
 * Per-player fog of war tracking
 */
export interface PlayerFogState {
  playerId: PlayerId;
  exploredTiles: Set<TileKey>; // All tiles ever seen
  visibleTiles: Set<TileKey>; // Currently visible tiles
  lastSeenSnapshots: Map<TileKey, TileSnapshot>; // Snapshots of explored tiles
}

/**
 * Fog transition event (for animations)
 */
export interface FogTransition {
  tileKey: TileKey;
  fromState: FogState;
  toState: FogState;
  turnNumber: number;
}

/**
 * Fog update batch (for efficient updates)
 */
export interface FogUpdateBatch {
  playerId: PlayerId;
  turnNumber: number;
  revealed: TileKey[]; // Tiles transitioning from UNEXPLORED to VISIBLE
  covered: TileKey[]; // Tiles transitioning from VISIBLE to EXPLORED
  snapshots: Map<TileKey, TileSnapshot>; // Updated snapshots for covered tiles
}
