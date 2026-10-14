/**
 * Exploration Store
 * Per-player exploration tracking and fog of war state
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlayerId, TileKey, FogState, TileSnapshot } from '@/data/types';
import { FogManager } from '@/game/engine/fog-manager';

export const useExplorationStore = defineStore('exploration', () => {
  // Fog manager instance
  const fogManager = ref(new FogManager());

  /**
   * Get fog state for a tile
   */
  function getFogState(playerId: PlayerId, tileKey: TileKey): FogState {
    return fogManager.value.getFogState(playerId, tileKey);
  }

  /**
   * Check if tile is explored
   */
  function isExplored(playerId: PlayerId, tileKey: TileKey): boolean {
    return fogManager.value.isExplored(playerId, tileKey);
  }

  /**
   * Check if tile is visible
   */
  function isVisible(playerId: PlayerId, tileKey: TileKey): boolean {
    return fogManager.value.isVisible(playerId, tileKey);
  }

  /**
   * Get last seen snapshot for a tile
   */
  function getLastSeenState(playerId: PlayerId, tileKey: TileKey): TileSnapshot | null {
    return fogManager.value.getSnapshot(playerId, tileKey);
  }

  /**
   * Get all explored tiles for a player
   */
  function getExploredTiles(playerId: PlayerId): TileKey[] {
    return fogManager.value.getExploredTiles(playerId);
  }

  /**
   * Get all visible tiles for a player
   */
  function getVisibleTiles(playerId: PlayerId): TileKey[] {
    return fogManager.value.getVisibleTiles(playerId);
  }

  /**
   * Get exploration statistics for a player
   */
  function getExplorationStats(playerId: PlayerId) {
    return fogManager.value.getExplorationStats(playerId);
  }

  /**
   * Clear exploration data for a player
   */
  function clearPlayerExploration(playerId: PlayerId): void {
    fogManager.value.clearPlayerFog(playerId);
  }

  /**
   * Clear all exploration data
   */
  function clearAllExploration(): void {
    fogManager.value.clearAllFog();
  }

  /**
   * Reset exploration store (new game)
   */
  function reset(): void {
    fogManager.value = new FogManager();
  }

  /**
   * Get fog manager (for internal use by game engine)
   */
  function getFogManager() {
    return fogManager.value as FogManager;
  }

  /**
   * Serialize exploration store state for saving
   */
  function serialize() {
    console.log('🔍 Serializing exploration/fog state');
    const fogData = fogManager.value.serialize();
    console.log('📊 Fog states count:', fogData.playerFogStates.length);
    return fogData;
  }

  /**
   * Deserialize exploration store state from save data
   */
  function deserialize(data: ReturnType<typeof serialize>): void {
    console.log('🔍 Deserializing exploration/fog state');
    console.log('📦 Restoring fog states for', data.playerFogStates.length, 'players');

    // Create new FogManager
    fogManager.value = new FogManager();

    // Restore fog states using FogManager's deserialize method
    fogManager.value.deserialize(data);

    console.log('✅ Fog states restored');
  }

  return {
    // Query methods
    getFogState,
    isExplored,
    isVisible,
    getLastSeenState,
    getExploredTiles,
    getVisibleTiles,
    getExplorationStats,

    // Mutation methods
    clearPlayerExploration,
    clearAllExploration,
    reset,
    serialize,
    deserialize,

    // Internal
    getFogManager,
  };
});
