/**
 * Fog of War Manager
 * Manages three fog states: UNEXPLORED, EXPLORED, VISIBLE
 */

import type {
  PlayerId,
  TileKey,
  FogState,
  TileFogState,
  TileSnapshot,
  FogUpdateBatch,
  Tile,
} from '@/data/types';
import { FogState as FogStateEnum } from '@/data/types';

/**
 * Fog of War Manager
 * Tracks fog state per player per tile
 */
export class FogManager {
  // Per-player fog states
  private playerFogStates: Map<PlayerId, Map<TileKey, TileFogState>>;

  // Per-player last seen snapshots
  private playerSnapshots: Map<PlayerId, Map<TileKey, TileSnapshot>>;

  constructor() {
    this.playerFogStates = new Map();
    this.playerSnapshots = new Map();
  }

  /**
   * Get fog state for a tile
   */
  getFogState(playerId: PlayerId, tileKey: TileKey): FogState {
    const playerStates = this.playerFogStates.get(playerId);
    if (!playerStates) {
      return FogStateEnum.UNEXPLORED;
    }

    const fogState = playerStates.get(tileKey);
    return fogState ? fogState.state : FogStateEnum.UNEXPLORED;
  }

  /**
   * Set fog state for a tile
   */
  setFogState(playerId: PlayerId, tileKey: TileKey, state: FogState, turnNumber: number): void {
    let playerStates = this.playerFogStates.get(playerId);
    if (!playerStates) {
      playerStates = new Map();
      this.playerFogStates.set(playerId, playerStates);
    }

    const existingState = playerStates.get(tileKey);

    playerStates.set(tileKey, {
      tileKey,
      state,
      lastSeenTurn: state === FogStateEnum.VISIBLE ? turnNumber : existingState?.lastSeenTurn,
      lastSeenSnapshot: existingState?.lastSeenSnapshot,
    });
  }

  /**
   * Save last seen snapshot for a tile
   */
  saveSnapshot(playerId: PlayerId, tileKey: TileKey, tile: Tile, turnNumber: number): void {
    let snapshots = this.playerSnapshots.get(playerId);
    if (!snapshots) {
      snapshots = new Map();
      this.playerSnapshots.set(playerId, snapshots);
    }

    const snapshot: TileSnapshot = {
      coordinates: tile.coordinates,
      terrain: tile.terrain,
      resourceDeposit: tile.resourceDeposit,
      building: tile.building,
      soldiers: tile.soldiers,
      snapshotTurnNumber: turnNumber,
    };

    snapshots.set(tileKey, snapshot);

    // Also update fog state to include snapshot
    const playerStates = this.playerFogStates.get(playerId);
    if (playerStates) {
      const fogState = playerStates.get(tileKey);
      if (fogState) {
        fogState.lastSeenSnapshot = snapshot;
      }
    }
  }

  /**
   * Get last seen snapshot for a tile
   */
  getSnapshot(playerId: PlayerId, tileKey: TileKey): TileSnapshot | null {
    const snapshots = this.playerSnapshots.get(playerId);
    return snapshots ? snapshots.get(tileKey) || null : null;
  }

  /**
   * Update fog states based on vision changes
   */
  updateFog(
    playerId: PlayerId,
    visibleTiles: Set<TileKey>,
    previouslyVisible: Set<TileKey>,
    currentTiles: Map<TileKey, Tile>,
    turnNumber: number,
  ): FogUpdateBatch {
    const revealed: TileKey[] = [];
    const covered: TileKey[] = [];
    const snapshots = new Map<TileKey, TileSnapshot>();

    // Tiles becoming visible
    for (const tileKey of visibleTiles) {
      const previousState = this.getFogState(playerId, tileKey);

      if (previousState !== FogStateEnum.VISIBLE) {
        revealed.push(tileKey);
        this.setFogState(playerId, tileKey, FogStateEnum.VISIBLE, turnNumber);

        // Mark as explored
        this.markExplored(playerId, tileKey);
      }
    }

    // Tiles losing visibility
    for (const tileKey of previouslyVisible) {
      if (!visibleTiles.has(tileKey)) {
        covered.push(tileKey);

        // Save snapshot
        const tile = currentTiles.get(tileKey);
        if (tile) {
          this.saveSnapshot(playerId, tileKey, tile, turnNumber);
          snapshots.set(tileKey, this.getSnapshot(playerId, tileKey)!);
        }

        // Update state to EXPLORED
        this.setFogState(playerId, tileKey, FogStateEnum.EXPLORED, turnNumber);
      }
    }

    return {
      playerId,
      turnNumber,
      revealed,
      covered,
      snapshots,
    };
  }

  /**
   * Mark a tile as explored (player has seen it at least once)
   */
  private markExplored(playerId: PlayerId, tileKey: TileKey): void {
    let playerStates = this.playerFogStates.get(playerId);
    if (!playerStates) {
      playerStates = new Map();
      this.playerFogStates.set(playerId, playerStates);
    }

    const existing = playerStates.get(tileKey);
    if (!existing) {
      playerStates.set(tileKey, {
        tileKey,
        state: FogStateEnum.VISIBLE,
      });
    }
  }

  /**
   * Check if player has explored a tile
   */
  isExplored(playerId: PlayerId, tileKey: TileKey): boolean {
    const state = this.getFogState(playerId, tileKey);
    return state !== FogStateEnum.UNEXPLORED;
  }

  /**
   * Check if tile is currently visible
   */
  isVisible(playerId: PlayerId, tileKey: TileKey): boolean {
    return this.getFogState(playerId, tileKey) === FogStateEnum.VISIBLE;
  }

  /**
   * Get all explored tiles for a player
   */
  getExploredTiles(playerId: PlayerId): TileKey[] {
    const playerStates = this.playerFogStates.get(playerId);
    if (!playerStates) return [];

    const explored: TileKey[] = [];
    for (const [tileKey, fogState] of playerStates.entries()) {
      if (fogState.state !== FogStateEnum.UNEXPLORED) {
        explored.push(tileKey);
      }
    }

    return explored;
  }

  /**
   * Get all visible tiles for a player
   */
  getVisibleTiles(playerId: PlayerId): TileKey[] {
    const playerStates = this.playerFogStates.get(playerId);
    if (!playerStates) return [];

    const visible: TileKey[] = [];
    for (const [tileKey, fogState] of playerStates.entries()) {
      if (fogState.state === FogStateEnum.VISIBLE) {
        visible.push(tileKey);
      }
    }

    return visible;
  }

  /**
   * Clear fog data for a player
   */
  clearPlayerFog(playerId: PlayerId): void {
    this.playerFogStates.delete(playerId);
    this.playerSnapshots.delete(playerId);
  }

  /**
   * Clear all fog data
   */
  clearAllFog(): void {
    this.playerFogStates.clear();
    this.playerSnapshots.clear();
  }

  /**
   * Get exploration statistics for a player
   */
  getExplorationStats(playerId: PlayerId) {
    const playerStates = this.playerFogStates.get(playerId);
    if (!playerStates) {
      return {
        totalExplored: 0,
        currentlyVisible: 0,
        previouslyVisible: 0,
      };
    }

    let totalExplored = 0;
    let currentlyVisible = 0;
    let previouslyVisible = 0;

    for (const fogState of playerStates.values()) {
      if (fogState.state !== FogStateEnum.UNEXPLORED) {
        totalExplored++;
      }
      if (fogState.state === FogStateEnum.VISIBLE) {
        currentlyVisible++;
      }
      if (fogState.state === FogStateEnum.EXPLORED) {
        previouslyVisible++;
      }
    }

    return {
      totalExplored,
      currentlyVisible,
      previouslyVisible,
    };
  }

  /**
   * Serialize fog manager state for saving
   * Using values-only pattern since playerId is embedded
   */
  serialize() {
    return {
      playerFogStates: Array.from(this.playerFogStates.entries()).map(([playerId, fogStates]) => ({
        playerId,
        fogStates: Array.from(fogStates.values()),
      })),
      playerSnapshots: Array.from(this.playerSnapshots.entries()).map(([playerId, snapshots]) => ({
        playerId,
        snapshots: Array.from(snapshots.values()),
      })),
    };
  }

  /**
   * Deserialize fog manager state from save data
   * Reconstruct Map keys from embedded properties
   */
  deserialize(data: {
    playerFogStates: Array<{ playerId: PlayerId; fogStates: TileFogState[] }>;
    playerSnapshots: Array<{ playerId: PlayerId; snapshots: TileSnapshot[] }>;
  }) {
    // Handle undefined or empty data (old save format or new game)
    if (!data || !data.playerFogStates || !data.playerSnapshots) {
      console.warn('⚠️ No fog data to deserialize, using empty state');
      this.playerFogStates = new Map();
      this.playerSnapshots = new Map();
      return;
    }

    // Reconstruct playerFogStates Map
    this.playerFogStates = new Map(
      data.playerFogStates.map((playerData) => [
        playerData.playerId,
        new Map(playerData.fogStates.map((fogState: TileFogState) => [fogState.tileKey, fogState])),
      ])
    );

    // Reconstruct playerSnapshots Map
    this.playerSnapshots = new Map(
      data.playerSnapshots.map((playerData) => [
        playerData.playerId,
        new Map(
          playerData.snapshots.map((snapshot: TileSnapshot) => {
            const key = `${snapshot.coordinates.x},${snapshot.coordinates.y}`;
            return [key, snapshot];
          })
        ),
      ])
    );
  }
}
