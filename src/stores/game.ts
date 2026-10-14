/**
 * Master Game Store
 * Manages save/load system and multiple game slots
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SaveMetadata, SaveSlot, SerializedGameState } from '@/data/types/serialization.types';
import { TurnPhase } from '@/data/types';

const SAVE_VERSION = 1;
const SAVE_KEY_PREFIX = 'terra-off-save-';

/**
 * Save a game to localStorage using a unique key
 */
function saveGameToStorage(gameId: string, slot: SaveSlot): void {
  const key = `${SAVE_KEY_PREFIX}${gameId}`;
  try {
    localStorage.setItem(key, JSON.stringify(slot));
    console.log(`💾 Saved to localStorage: ${key}`);
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
    throw new Error('Failed to save game to storage');
  }
}

/**
 * Load a game from localStorage
 */
function loadGameFromStorage(gameId: string): SaveSlot | null {
  const key = `${SAVE_KEY_PREFIX}${gameId}`;
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as SaveSlot;
  } catch (error) {
    console.error('❌ Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Delete a game from localStorage
 */
function deleteGameFromStorage(gameId: string): void {
  const key = `${SAVE_KEY_PREFIX}${gameId}`;
  localStorage.removeItem(key);
  console.log(`🗑️ Deleted from localStorage: ${key}`);
}

export const useGameStore = defineStore('game', () => {
  // Current active game ID
  const currentGameId = ref<string | null>(null);

  // Game metadata only (not the full game state)
  const gameMetadata = ref<Record<string, SaveMetadata>>({});

  // Playtime tracking
  const sessionStartTime = ref<number | null>(null);
  const accumulatedPlaytime = ref(0);

  /**
   * Scan localStorage for orphaned save files and rebuild metadata
   */
  function scanForOrphanedSaves(): void {
    const saveKeys = Object.keys(localStorage).filter(key => key.startsWith(SAVE_KEY_PREFIX));

    for (const key of saveKeys) {
      const gameId = key.replace(SAVE_KEY_PREFIX, '');

      // If we don't have metadata for this save, load it
      if (!gameMetadata.value[gameId]) {
        const slot = loadGameFromStorage(gameId);
        if (slot?.metadata) {
          gameMetadata.value[gameId] = slot.metadata;
          console.log('🔍 Found orphaned save:', slot.metadata.name);
        }
      }
    }
  }

  /**
   * Generate unique game ID
   */
  function generateGameId(): string {
    return `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current playtime in seconds
   */
  function getCurrentPlaytime(): number {
    if (!sessionStartTime.value) return accumulatedPlaytime.value;

    const sessionDuration = Math.floor((Date.now() - sessionStartTime.value) / 1000);
    return accumulatedPlaytime.value + sessionDuration;
  }

  /**
   * Start playtime tracking
   */
  function startPlaytimeTracking(): void {
    sessionStartTime.value = Date.now();
  }

  /**
   * Stop playtime tracking and accumulate
   */
  function stopPlaytimeTracking(): void {
    if (sessionStartTime.value) {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.value) / 1000);
      accumulatedPlaytime.value += sessionDuration;
      sessionStartTime.value = null;
    }
  }

  /**
   * Reset playtime tracking
   */
  function resetPlaytime(): void {
    sessionStartTime.value = null;
    accumulatedPlaytime.value = 0;
  }

  /**
   * Create a new game
   */
  async function createNewGame(name: string): Promise<string> {
    const gameId = generateGameId();
    const now = new Date().toISOString();

    // Import stores
    const { useTurnStore } = await import('@/stores/game/turn');
    const { useResourcesStore } = await import('@/stores/game/resources');
    const { useBuildingsStore } = await import('@/stores/game/buildings');
    const { usePeasantsStore } = await import('@/stores/game/peasants');
    const { useMapStore } = await import('@/stores/game/map');
    const { useExplorationStore } = await import('@/stores/game/exploration');
    const { useSettlementsStore } = await import('@/stores/game/settlements');

    // Reset all stores
    const turnStore = useTurnStore();
    const resourcesStore = useResourcesStore();
    const buildingsStore = useBuildingsStore();
    const peasantsStore = usePeasantsStore();
    const mapStore = useMapStore();
    const explorationStore = useExplorationStore();
    const settlementsStore = useSettlementsStore();

    turnStore.reset();
    resourcesStore.reset();
    buildingsStore.reset();
    peasantsStore.reset();
    mapStore.reset();
    explorationStore.reset();
    settlementsStore.reset();

    // Set current game
    currentGameId.value = gameId;
    console.log('✅ Set currentGameId to:', gameId);

    // Reset and start playtime tracking
    resetPlaytime();
    startPlaytimeTracking();

    // Create metadata
    const metadata: SaveMetadata = {
      gameId,
      name,
      createdAt: now,
      savedAt: now,
      turnNumber: 1,
      playtime: 0,
      version: SAVE_VERSION,
    };

    // Store metadata
    gameMetadata.value[gameId] = metadata;

    // Create empty game state (will be populated by auto-save)
    const gameState: SerializedGameState = {
      turn: {
        turnNumber: 1,
        currentPlayerId: null,
        phase: TurnPhase.ACTION,
        turnOrder: [],
        turnStartedAt: now,
        playerActionStates: [],
        queuedActions: [],
        turnHistory: [],
      },
      resources: {
        playerResources: [],
        transactionHistory: [],
      },
      buildings: {
        placedBuildings: [],
        constructionQueue: [],
        nextEntityId: 1,
      },
      peasants: {
        playerPeasantStates: [],
      },
      map: {
        mapSeed: '',
        loadedTiles: [],
      },
      exploration: {
        playerFogStates: [],
        playerSnapshots: [],
      },
      settlements: {
        settlements: [],
        wallSegments: [],
        formationEvents: [],
        destructionEvents: [],
        currentLoops: [],
        invalidLoops: [],
      },
    };

    // Save to localStorage with separate key
    saveGameToStorage(gameId, {
      metadata,
      gameState,
    });

    return gameId;
  }

  /**
   * Save current game state
   */
  async function saveGame(): Promise<void> {
    if (!currentGameId.value) {
      console.warn('💾 No active game to save');
      return;
    }

    console.log('💾 Saving game:', currentGameId.value);

    const gameId = currentGameId.value;
    const existingMetadata = gameMetadata.value[gameId];

    if (!existingMetadata) {
      console.error(`❌ Game metadata not found: ${gameId}`);
      return;
    }

    // Import stores
    const { useTurnStore } = await import('@/stores/game/turn');
    const { useResourcesStore } = await import('@/stores/game/resources');
    const { useBuildingsStore } = await import('@/stores/game/buildings');
    const { usePeasantsStore } = await import('@/stores/game/peasants');
    const { useMapStore } = await import('@/stores/game/map');
    const { useExplorationStore } = await import('@/stores/game/exploration');
    const { useSettlementsStore } = await import('@/stores/game/settlements');

    const turnStore = useTurnStore();
    const resourcesStore = useResourcesStore();
    const buildingsStore = useBuildingsStore();
    const peasantsStore = usePeasantsStore();
    const mapStore = useMapStore();
    const explorationStore = useExplorationStore();
    const settlementsStore = useSettlementsStore();

    // Collect serialized state from all stores
    const gameState: SerializedGameState = {
      turn: turnStore.serialize(),
      resources: resourcesStore.serialize(),
      buildings: buildingsStore.serialize(),
      peasants: peasantsStore.serialize(),
      map: mapStore.serialize(),
      exploration: explorationStore.serialize(),
      settlements: settlementsStore.serialize(),
    };

    // Update metadata
    const metadata: SaveMetadata = {
      ...existingMetadata,
      savedAt: new Date().toISOString(),
      turnNumber: turnStore.turnNumber,
      playtime: getCurrentPlaytime(),
    };

    // Update metadata in store
    gameMetadata.value[gameId] = metadata;

    // Save to localStorage with separate key
    saveGameToStorage(gameId, {
      metadata,
      gameState,
    });

    console.log('✅ Game saved successfully:', metadata.name, 'Turn:', metadata.turnNumber);
  }

  /**
   * Load a game by ID
   */
  async function loadGame(gameId: string): Promise<void> {
    // Load from localStorage
    const slot = loadGameFromStorage(gameId);

    if (!slot) {
      console.error(`❌ Game not found in storage: ${gameId}`);
      return;
    }

    console.log('📂 Loading game:', slot.metadata.name);

    // Import stores
    const { useTurnStore } = await import('@/stores/game/turn');
    const { useResourcesStore } = await import('@/stores/game/resources');
    const { useBuildingsStore } = await import('@/stores/game/buildings');
    const { usePeasantsStore } = await import('@/stores/game/peasants');
    const { useMapStore } = await import('@/stores/game/map');
    const { useExplorationStore } = await import('@/stores/game/exploration');
    const { useSettlementsStore } = await import('@/stores/game/settlements');

    const turnStore = useTurnStore();
    const resourcesStore = useResourcesStore();
    const buildingsStore = useBuildingsStore();
    const peasantsStore = usePeasantsStore();
    const mapStore = useMapStore();
    const explorationStore = useExplorationStore();
    const settlementsStore = useSettlementsStore();

    // Deserialize into stores
    turnStore.deserialize(slot.gameState.turn);
    resourcesStore.deserialize(slot.gameState.resources);
    buildingsStore.deserialize(slot.gameState.buildings);
    peasantsStore.deserialize(slot.gameState.peasants);
    mapStore.deserialize(slot.gameState.map);
    explorationStore.deserialize(slot.gameState.exploration);
    settlementsStore.deserialize(slot.gameState.settlements);

    // Set current game
    currentGameId.value = gameId;
    console.log('✅ Set currentGameId to:', gameId, 'after loading');

    // Update metadata if not already present
    if (!gameMetadata.value[gameId]) {
      gameMetadata.value[gameId] = slot.metadata;
    }

    // Restore playtime
    accumulatedPlaytime.value = slot.metadata.playtime;
    startPlaytimeTracking();

    console.log('✅ Game loaded successfully:', slot.metadata.name, 'Turn:', slot.metadata.turnNumber);
  }

  /**
   * Delete a game save
   */
  function deleteGame(gameId: string): boolean {
    if (!gameMetadata.value[gameId]) {
      return false;
    }

    // Delete from localStorage
    deleteGameFromStorage(gameId);

    // Delete metadata
    delete gameMetadata.value[gameId];

    // If deleted game was current, clear current
    if (currentGameId.value === gameId) {
      currentGameId.value = null;
      stopPlaytimeTracking();
      resetPlaytime();
    }

    return true;
  }

  /**
   * Get save metadata for a game
   */
  function getSaveMetadata(gameId: string): SaveMetadata | null {
    return gameMetadata.value[gameId] || null;
  }

  /**
   * Get all save metadata
   */
  const allSaves = computed((): SaveMetadata[] => {
    return Object.values(gameMetadata.value);
  });

  /**
   * Get current game metadata
   */
  const currentGameMetadata = computed((): SaveMetadata | null => {
    if (!currentGameId.value) return null;
    return getSaveMetadata(currentGameId.value);
  });

  /**
   * Check if there's an active game
   */
  const hasActiveGame = computed(() => currentGameId.value !== null);

  // Initialize: scan for orphaned saves on store creation
  scanForOrphanedSaves();

  return {
    // State (writable refs for persistence)
    currentGameId,
    gameMetadata,

    // Computed state
    currentGameMetadata,
    allSaves,
    hasActiveGame,

    // Actions
    createNewGame,
    saveGame,
    loadGame,
    deleteGame,
    getSaveMetadata,
    scanForOrphanedSaves,

    // Playtime
    getCurrentPlaytime,
    startPlaytimeTracking,
    stopPlaytimeTracking,
  };
}, {
  persist: {
    key: 'terra-off-game',
  },
});
