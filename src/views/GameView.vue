<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '@/stores/game';
import { useTurnStore } from '@/stores/game/turn';
import { useResourcesStore } from '@/stores/game/resources';
import { useMapStore } from '@/stores/game/map';
import { useExplorationStore } from '@/stores/game/exploration';
import { usePeasantsStore } from '@/stores/game/peasants';
import { useBuildingsStore } from '@/stores/game/buildings';
import { useNotification } from '@/composables/useNotification';
import ResourceDisplay from '@/components/game/resources/ResourceDisplay.vue';
import TurnIndicator from '@/components/game/turn/TurnIndicator.vue';
import ActionCounter from '@/components/game/turn/ActionCounter.vue';
import EndTurnButton from '@/components/game/turn/EndTurnButton.vue';
import GridRenderer from '@/components/game/map/GridRenderer.vue';
import GameSidebar from '@/components/game/ui/GameSidebar.vue';
import BuildingDetails from '@/components/game/buildings/BuildingDetails.vue';
import { toTileKey, FogState } from '@/data/types';
import type { BuildingDefinition } from '@/data/buildings';
import type { Coordinates } from '@/data/types';

const router = useRouter();
const { t } = useI18n();
const gameStore = useGameStore();
const turnStore = useTurnStore();
const resourceStore = useResourcesStore();
const mapStore = useMapStore();
const explorationStore = useExplorationStore();
const peasantsStore = usePeasantsStore();
const buildingsStore = useBuildingsStore();
const { confirm, error } = useNotification();

const showWelcome = ref(true);
const selectedBuilding = ref<BuildingDefinition | null>(null);
const selectedBuildingCoords = ref<Coordinates | null>(null);
const sidebarRef = ref<InstanceType<typeof GameSidebar> | null>(null);
const gridRendererRef = ref<InstanceType<typeof GridRenderer> | null>(null);
const gameLoaded = ref(false);

onMounted(async () => {
  console.log('🎮 GameView mounted');
  console.log('📦 Current game ID:', gameStore.currentGameId);
  console.log('📦 Has active game:', gameStore.hasActiveGame);
  console.log('📦 Game metadata:', gameStore.gameMetadata);
  console.log('📦 All saves:', gameStore.allSaves);
  console.log('📦 localStorage key:', localStorage.getItem('terra-off-game'));

  // Check if there's an active game
  if (!gameStore.hasActiveGame) {
    console.warn('⚠️ No active game found');
    console.log('📊 currentGameId value:', gameStore.currentGameId);
    console.log('📊 Checking for orphaned saves...');
    gameStore.scanForOrphanedSaves();

    if (!gameStore.hasActiveGame) {
      console.warn('⚠️ Still no active game after scan, redirecting to menu');
      error('No active game. Please create or load a game first.');
      router.push('/');
      return;
    }
  }

  // If game stores are empty (page refresh), load the active game
  if (!turnStore.currentPlayerId && gameStore.currentGameId) {
    console.log('🔄 Game stores empty after refresh, loading game:', gameStore.currentGameId);
    try {
      await gameStore.loadGame(gameStore.currentGameId);
      console.log('✅ Game loaded from storage');

      // Recalculate vision for the current player after loading
      if (turnStore.currentPlayerId) {
        console.log('🔍 Recalculating vision after game load...');
        explorationStore.recalculateVisionNow(turnStore.currentPlayerId);
      }
    } catch (err) {
      console.error('❌ Failed to load game:', err);
      error('Failed to load game');
      router.push('/');
      return;
    }
  }

  console.log('✅ Active game found:', gameStore.currentGameMetadata?.name);
  console.log('📊 Turn:', turnStore.turnNumber);
  console.log('🎯 Current player:', turnStore.currentPlayerId);

  // Start playtime tracking
  gameStore.startPlaytimeTracking();

  // Check if this is a brand new game (turn 1, no player initialized)
  if (!turnStore.currentPlayerId) {
    console.log('🆕 Initializing new game state...');
    initializeNewGame();
  }

  // Add keyboard listener for ESC key to deselect building
  window.addEventListener('keydown', handleKeyPress);

  gameLoaded.value = true;
  showWelcome.value = turnStore.turnNumber === 1; // Show welcome only for brand new games
});

onBeforeUnmount(() => {
  // Stop playtime tracking and auto-save when leaving game view
  gameStore.stopPlaytimeTracking();
  gameStore.saveGame();

  // Remove keyboard listener
  window.removeEventListener('keydown', handleKeyPress);
});

function initializeNewGame() {
  // Initialize game state (called after createNewGame in MenuView)
  const playerId = 'player1';

  // Initialize turn system
  turnStore.initializeTurnSystem([playerId], playerId);

  // Initialize resources
  resourceStore.initializePlayerResources(playerId);

  // Initialize peasants
  peasantsStore.initializePlayerPeasants(playerId);

  // Initialize map
  mapStore.initializeMap('default-seed');

  // FOR TESTING: Give player starting peasants and resources
  peasantsStore.addPeasantSource(playerId, 'starter-house', 'house', { x: 0, y: 0 }, 20);

  // Grant initial vision manually (temporary until player builds first building)
  // This will be replaced by vision from actual buildings once placed
  const initialVisionRadius = 5;
  for (let y = -initialVisionRadius; y <= initialVisionRadius; y++) {
    for (let x = -initialVisionRadius; x <= initialVisionRadius; x++) {
      const distance = Math.sqrt(x * x + y * y);
      if (distance <= initialVisionRadius) {
        const tileKey = toTileKey(x, y);
        explorationStore.getFogManager().setFogState(playerId, tileKey, FogState.VISIBLE, 1);
        // Also ensure the tile exists
        mapStore.ensureTilesExist([tileKey]);
      }
    }
  }

  // Save initial game state
  gameStore.saveGame();
}

function closeWelcome() {
  showWelcome.value = false;
}

function handleBuildingSelected(building: BuildingDefinition | null) {
  selectedBuilding.value = building;
}

function handleBuildingPlaced() {
  // Keep selection active for continuous placement
  // User can press ESC or select a different building to deselect
}

function handleBuildingClick(coordinates: Coordinates) {
  selectedBuildingCoords.value = coordinates;
}

function closeBuildingDetails() {
  selectedBuildingCoords.value = null;
}

function handleKeyPress(event: KeyboardEvent) {
  // ESC key deselects building
  if (event.key === 'Escape') {
    if (selectedBuilding.value) {
      selectedBuilding.value = null;
    }
  }
}

function handlePanTo(coordinates: Coordinates) {
  if (gridRendererRef.value) {
    gridRendererRef.value.panToLocation(coordinates.x, coordinates.y);
  }
}

function handleMainMenu() {
  confirm(
    t('turn.confirm.returnToMenu'),
    () => {
      // Navigate to home/menu (for now, just reload)
      window.location.href = '/';
    },
  );
}
</script>

<template>
  <div class="flex h-screen flex-col bg-gray-900">
    <!-- Welcome Modal -->
    <div
      v-if="showWelcome"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      @click="closeWelcome"
    >
      <div
        class="max-w-2xl rounded-xl border border-blue-500/30 bg-gray-800 p-8 shadow-2xl"
        @click.stop
      >
        <div class="mb-4 flex items-center gap-3">
          <span class="text-4xl">🎮</span>
          <h1 class="text-2xl font-bold text-white">Welcome to Terra-Off!</h1>
        </div>

        <div class="mb-6 space-y-3 text-gray-300">
          <p class="text-lg">
            A turn-based post-apocalyptic strategy game. Here's what you can do right now:
          </p>

          <div class="rounded-lg bg-gray-700/50 p-4">
            <h3 class="mb-2 font-semibold text-blue-400">✅ Currently Available (Phase 5):</h3>
            <ul class="space-y-1 text-sm">
              <li>• <strong>View Resources</strong> - Top bar shows food, wood, stone, iron</li>
              <li>• <strong>Manage Peasants</strong> - Open "Peasants" tab in right sidebar</li>
              <li>• <strong>End Turn</strong> - Click "End Turn" to produce resources</li>
              <li>• <strong>View Turn History</strong> - See actions in "History" tab</li>
              <li>• <strong>Explore Map</strong> - Drag to pan, scroll to zoom</li>
            </ul>
          </div>

          <div class="rounded-lg bg-yellow-500/10 p-4">
            <h3 class="mb-2 font-semibold text-yellow-400">🚧 Coming Soon:</h3>
            <ul class="space-y-1 text-sm">
              <li>• <strong>Phase 6</strong>: Building placement (farms, walls, barracks)</li>
              <li>• <strong>Phase 7</strong>: Research & technology tree</li>
              <li>• <strong>Phase 8</strong>: Combat & military units</li>
            </ul>
          </div>

          <div class="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <h3 class="mb-2 font-semibold text-green-400">💡 Try This:</h3>
            <ol class="space-y-1 text-sm">
              <li>1. Check the "Peasants" tab → You start with 25 peasants</li>
              <li>2. Click "End Turn" button → Watch resources increase!</li>
              <li>3. Open "History" tab → See your turn actions logged</li>
              <li>4. You have <strong>5 actions per turn</strong> (will be used in Phase 6+)</li>
            </ol>
          </div>
        </div>

        <button
          @click="closeWelcome"
          class="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Start Playing!
        </button>
      </div>
    </div>

    <!-- Top Bar: Resources and Turn Info -->
    <header
      class="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3"
    >
      <div class="flex items-center gap-6">
        <button
          @click="handleMainMenu"
          class="rounded px-3 py-1 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
          title="Main Menu"
        >
          ☰ Menu
        </button>
        <div class="h-6 w-px bg-gray-600"></div>
        <TurnIndicator />
        <div class="h-6 w-px bg-gray-600"></div>
        <ResourceDisplay />
      </div>

      <div class="flex items-center gap-4">
        <ActionCounter />
        <EndTurnButton />
      </div>
    </header>

    <!-- Main Game Area -->
    <main class="flex flex-1 overflow-hidden">
      <!-- Map Renderer -->
      <div class="flex-1">
        <GridRenderer
          ref="gridRendererRef"
          :selected-building="selectedBuilding"
          @building-placed="handleBuildingPlaced"
          @building-click="handleBuildingClick"
        />
      </div>

      <!-- Sidebar -->
      <GameSidebar
        ref="sidebarRef"
        :selected-building="selectedBuilding"
        @building-selected="handleBuildingSelected"
        @building-click="handleBuildingClick"
        @pan-to="handlePanTo"
      />
    </main>

    <!-- Building Details Modal -->
    <BuildingDetails
      v-if="selectedBuildingCoords"
      :coordinates="selectedBuildingCoords"
      @close="closeBuildingDetails"
    />
  </div>
</template>
