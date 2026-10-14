/**
 * Serialization Types
 * Types for save/load system serialization and deserialization
 */

import type {
  PlayerId,
  TurnPhase,
  PlayerActionState,
  PlayerAction,
  TurnHistoryEntry,
  PlayerResources,
  ResourceTransaction,
  PeasantSource,
  PeasantAllocation,
  TileKey,
  TileFogState,
  TileSnapshot,
  SettlementFormationEvent,
  SettlementDestructionEvent,
  WallLoop,
  Settlement,
  Coordinates,
  TerrainType,
  ResourceDeposit,
  TileBuilding,
  TileSoldiers,
} from '@/data/types';
import type { PlacedBuilding, BuildingInConstruction } from '@/stores/game/buildings';

/**
 * Save metadata for a game slot
 */
export interface SaveMetadata {
  gameId: string;
  name: string;
  createdAt: string; // ISO date string
  savedAt: string; // ISO date string
  turnNumber: number;
  playtime: number; // seconds
  version: number; // Save format version
}

/**
 * Serialized Turn Store State
 * Using values-only pattern since playerId is embedded in PlayerActionState
 */
export interface TurnSerializedState {
  turnNumber: number;
  currentPlayerId: PlayerId | null;
  phase: TurnPhase;
  turnOrder: PlayerId[];
  turnStartedAt: string; // ISO date string
  playerActionStates: PlayerActionState[]; // Keys reconstructed from playerId
  queuedActions: PlayerAction[];
  turnHistory: TurnHistoryEntry[];
}

/**
 * Serialized Resources Store State
 * Using values-only pattern since playerId is embedded in PlayerResources
 */
export interface ResourcesSerializedState {
  playerResources: PlayerResources[]; // Keys reconstructed from playerId
  transactionHistory: ResourceTransaction[];
}

/**
 * Serialized Buildings Store State
 * Using values-only pattern since keys are embedded in objects
 */
export interface BuildingsSerializedState {
  placedBuildings: PlacedBuilding[]; // Keys reconstructed from coordinates
  constructionQueue: BuildingInConstruction[]; // Keys reconstructed from entityId
  nextEntityId: number;
}

/**
 * Serialized Peasants Store State
 * Using values-only pattern since keys are embedded in objects
 */
export interface PeasantsSerializedState {
  playerPeasantStates: Array<{
    playerId: PlayerId;
    totalPeasants: number;
    allocatedPeasants: number;
    unallocatedPeasants: number;
    allocations: PeasantAllocation[]; // Keys reconstructed from targetId
    peasantSources: PeasantSource[];
  }>;
}

/**
 * Serialized tile data (Tile with Date converted to string)
 */
export interface SerializedTileData {
  coordinates: Coordinates;
  terrain: TerrainType;
  resourceDeposit: ResourceDeposit | null;
  building: TileBuilding | null;
  soldiers: TileSoldiers | null;
  generatedAt: string; // ISO string
  lastModified: string; // ISO string
}

/**
 * Serialized Map Store State
 */
export interface MapSerializedState {
  mapSeed: string;
  loadedTiles: Array<{
    key: TileKey;
    data: SerializedTileData;
  }>;
}

/**
 * Serialized Exploration Store State
 * Using values-only pattern since playerId is embedded
 */
export interface ExplorationSerializedState {
  playerFogStates: Array<{
    playerId: PlayerId;
    fogStates: TileFogState[];
  }>;
  playerSnapshots: Array<{
    playerId: PlayerId;
    snapshots: TileSnapshot[];
  }>;
}

/**
 * Serialized Settlements Store State
 */
export interface SettlementsSerializedState {
  settlements: Settlement[];
  wallSegments: unknown[]; // WallManager segments
  formationEvents: SettlementFormationEvent[];
  destructionEvents: SettlementDestructionEvent[];
  currentLoops: WallLoop[];
  invalidLoops: WallLoop[];
}

/**
 * Combined serialized game state
 */
export interface SerializedGameState {
  turn: TurnSerializedState;
  resources: ResourcesSerializedState;
  buildings: BuildingsSerializedState;
  peasants: PeasantsSerializedState;
  map: MapSerializedState;
  exploration: ExplorationSerializedState;
  settlements: SettlementsSerializedState;
}

/**
 * Complete save slot with metadata and game state
 */
export interface SaveSlot {
  metadata: SaveMetadata;
  gameState: SerializedGameState;
}

/**
 * Master game store state structure
 */
export interface GameStoreState {
  currentGameId: string | null;
  games: Record<string, SaveSlot>; // gameId -> SaveSlot
}
