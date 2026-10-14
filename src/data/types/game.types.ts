/**
 * Base Game Entity Types and Enums
 * Core types used throughout the game
 */

/**
 * Player identifier
 */
export type PlayerId = string;

/**
 * Unique identifier for game entities
 */
export type EntityId = string;

/**
 * Coordinate type for tile positions
 */
export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Tile coordinate as string key for efficient lookups
 * Format: "x,y"
 */
export type TileKey = string;

/**
 * Helper to create tile key from coordinates
 */
export function toTileKey(x: number, y: number): TileKey {
  return `${x},${y}`;
}

/**
 * Helper to parse tile key back to coordinates
 */
export function fromTileKey(key: TileKey): Coordinates {
  const parts = key.split(',').map(Number);
  return { x: parts[0]!, y: parts[1]! };
}

/**
 * Game difficulty levels
 */
export enum GameDifficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
}

/**
 * Game phase/state
 */
export enum GamePhase {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

/**
 * Player color for UI display
 */
export enum PlayerColor {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  PURPLE = 'PURPLE',
  ORANGE = 'ORANGE',
}

/**
 * Player information
 */
export interface Player {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  isAI: boolean;
  isEliminated: boolean;
}

/**
 * Game session metadata
 */
export interface GameMetadata {
  gameId: string;
  createdAt: Date;
  lastSavedAt: Date;
  mapSeed: string;
  difficulty: GameDifficulty;
  phase: GamePhase;
  players: Player[];
}
