<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMapStore } from '@/stores/game/map';
import { useExplorationStore } from '@/stores/game/exploration';
import { useTurnStore } from '@/stores/game/turn';
import { useBuildingsStore } from '@/stores/game/buildings';
import { useResourcesStore } from '@/stores/game/resources';
import { useNotification } from '@/composables/useNotification';
import { FogState, ActionType } from '@/data/types';
import type { BuildingDefinition } from '@/data/buildings';
import { validateBuildingPlacement } from '@/game/engine/building-placer';
import TileView from './TileView.vue';
import WallOverlay from './WallOverlay.vue';
import BuildingOverlay from './BuildingOverlay.vue';
import MapControls from './MapControls.vue';

interface Props {
  selectedBuilding?: BuildingDefinition | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'buildingPlaced'): void;
  (e: 'buildingClick', coordinates: { x: number; y: number }): void;
}>();

const mapStore = useMapStore();
const explorationStore = useExplorationStore();
const turnStore = useTurnStore();
const buildingsStore = useBuildingsStore();
const resourcesStore = useResourcesStore();
const { error } = useNotification();

// Grid settings
const TILE_SIZE = 40; // pixels per tile
const viewportWidth = ref(0);
const viewportHeight = ref(0);

// Camera position (center of view in world coordinates)
const cameraX = ref(0);
const cameraY = ref(0);
const zoom = ref(1.0);

// Panning state
const isPanning = ref(false);
const panStartX = ref(0);
const panStartY = ref(0);

const containerRef = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (containerRef.value) {
    viewportWidth.value = containerRef.value.clientWidth;
    viewportHeight.value = containerRef.value.clientHeight;

    // Load initial tiles around spawn point (0,0)
    loadVisibleTiles();
  }
});

// Calculate visible tile range
const visibleTileRange = computed(() => {
  const tilesWide = Math.ceil(viewportWidth.value / (TILE_SIZE * zoom.value)) + 2;
  const tilesHigh = Math.ceil(viewportHeight.value / (TILE_SIZE * zoom.value)) + 2;

  const minX = Math.floor(cameraX.value - tilesWide / 2);
  const maxX = Math.ceil(cameraX.value + tilesWide / 2);
  const minY = Math.floor(cameraY.value - tilesHigh / 2);
  const maxY = Math.ceil(cameraY.value + tilesHigh / 2);

  return { minX, maxX, minY, maxY };
});

// Get tiles to render
const tilesToRender = computed(() => {
  const { minX, maxX, minY, maxY } = visibleTileRange.value;
  const tiles = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tile = mapStore.getTile({ x, y });
      const playerId = turnStore.currentPlayerId;
      const tileKey = `${x},${y}`;
      const fogState = playerId
        ? explorationStore.getFogState(playerId, tileKey)
        : FogState.UNEXPLORED;

      tiles.push({
        x,
        y,
        tile,
        fogState,
      });
    }
  }

  return tiles;
});

function loadVisibleTiles() {
  const { minX, maxX, minY, maxY } = visibleTileRange.value;
  const coords = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      coords.push({ x, y });
    }
  }

  mapStore.loadTiles(coords);
}

// Convert world coordinates to screen coordinates
function worldToScreen(worldX: number, worldY: number) {
  const screenX =
    (worldX - cameraX.value) * TILE_SIZE * zoom.value + viewportWidth.value / 2;
  const screenY =
    (worldY - cameraY.value) * TILE_SIZE * zoom.value + viewportHeight.value / 2;
  return { x: screenX, y: screenY };
}

// Computed loaded tile count
const loadedTileCount = computed(() => mapStore.loadedTileCount);

// Mouse handlers for panning
function handleMouseDown(event: MouseEvent) {
  // Don't pan when in placement mode
  if (props.selectedBuilding) return;

  isPanning.value = true;
  panStartX.value = event.clientX;
  panStartY.value = event.clientY;
}

function handleMouseMove(event: MouseEvent) {
  if (!isPanning.value) return;

  const deltaX = event.clientX - panStartX.value;
  const deltaY = event.clientY - panStartY.value;

  cameraX.value -= deltaX / (TILE_SIZE * zoom.value);
  cameraY.value -= deltaY / (TILE_SIZE * zoom.value);

  panStartX.value = event.clientX;
  panStartY.value = event.clientY;

  loadVisibleTiles();
}

function handleMouseUp() {
  isPanning.value = false;
}

// Zoom handlers
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
  zoom.value = Math.max(0.5, Math.min(3.0, zoom.value * zoomDelta));
  loadVisibleTiles();
}

function handleZoomIn() {
  zoom.value = Math.min(3.0, zoom.value * 1.2);
  loadVisibleTiles();
}

function handleZoomOut() {
  zoom.value = Math.max(0.5, zoom.value / 1.2);
  loadVisibleTiles();
}

function handleResetView() {
  cameraX.value = 0;
  cameraY.value = 0;
  zoom.value = 1.0;
  loadVisibleTiles();
}

const showGrid = ref(true);
const showSettlements = ref(true);

function toggleGrid() {
  showGrid.value = !showGrid.value;
}

function toggleSettlements() {
  showSettlements.value = !showSettlements.value;
}

function handleTileClick(x: number, y: number) {
  // If building is selected, place it
  if (props.selectedBuilding && turnStore.currentPlayerId) {
    placeBuilding(x, y);
    return;
  }

  // Otherwise, show tile details
  console.log('Tile clicked:', x, y);
  // TODO: Show tile details panel
}

function placeBuilding(x: number, y: number) {
  if (!props.selectedBuilding || !turnStore.currentPlayerId) return;

  const playerId = turnStore.currentPlayerId;
  const coordinates = { x, y };

  // Validate placement
  const validation = validateBuildingPlacement(
    {
      playerId,
      buildingId: props.selectedBuilding.id,
      coordinates,
      turnNumber: turnStore.turnNumber,
    },
    {
      hasBuildingAt: (coords) => buildingsStore.hasBuildingAt(coords),
      hasConstructionAt: (coords) => buildingsStore.hasConstructionAt(coords),
      canAffordCost: (cost) => resourcesStore.checkCanAfford(playerId, cost).canAfford,
      hasActionsRemaining: (actionType) => turnStore.canTakeAction(playerId, actionType),
      getTerrain: (coords) => {
        const tile = mapStore.getTile(coords);
        return tile ? tile.terrain : null;
      },
    },
  );

  if (!validation.valid) {
    error(validation.errors.join('\n'));
    return;
  }

  // Deduct resources
  const success = resourcesStore.spendResources(
    playerId,
    props.selectedBuilding.cost,
    `Build ${props.selectedBuilding.id}`,
    turnStore.turnNumber,
  );

  if (!success) {
    error('Failed to spend resources');
    return;
  }

  // Deduct action
  if (!turnStore.spendActions(playerId, ActionType.BUILD, 1)) {
    error('No actions remaining');
    // Refund resources
    resourcesStore.addResources(
      playerId,
      props.selectedBuilding.cost,
      'Building placement cancelled',
      turnStore.turnNumber,
    );
    return;
  }

  // Start construction
  const entityId = buildingsStore.startConstruction(
    playerId,
    props.selectedBuilding.id,
    coordinates,
    turnStore.turnNumber,
  );

  if (entityId) {
    console.log(`✅ Building placed: ${props.selectedBuilding.id} at (${x}, ${y})`);
    emit('buildingPlaced');

    // Auto-save after building placement
    import('@/stores/game').then(({ useGameStore }) => {
      console.log('🏗️ Building placed, triggering auto-save...');
      const gameStore = useGameStore();
      gameStore.saveGame();
    });
  } else {
    console.error('Failed to start construction');
    // Refund
    resourcesStore.addResources(
      playerId,
      props.selectedBuilding.cost,
      'Construction failed',
      turnStore.turnNumber,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleTileHover(_x: number, _y: number) {
  // TODO: Show tile tooltip
}

function handleBuildingClick(coordinates: { x: number; y: number }) {
  emit('buildingClick', coordinates);
}

/**
 * Pan camera to specific location
 */
function panToLocation(x: number, y: number) {
  cameraX.value = x;
  cameraY.value = y;
  loadVisibleTiles();
}

// Expose methods to parent components
defineExpose({
  panToLocation,
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full overflow-hidden bg-gray-950"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @wheel="handleWheel"
  >
    <!-- Placement Mode Banner -->
    <div
      v-if="selectedBuilding"
      class="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-lg border border-blue-500 bg-blue-600 px-4 py-2 text-white shadow-lg"
    >
      <div class="flex items-center gap-2">
        <span class="text-lg">🏗️</span>
        <div class="text-sm">
          <div class="font-semibold">Placement Mode</div>
          <div class="text-xs text-blue-100">Click a tile to place {{ selectedBuilding.id }}</div>
        </div>
      </div>
    </div>

    <!-- SVG Grid Renderer -->
    <svg
      class="h-full w-full"
      :class="selectedBuilding ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'"
      :viewBox="`0 0 ${viewportWidth} ${viewportHeight}`"
    >
      <!-- Render tiles using TileView component -->
      <TileView
        v-for="item in tilesToRender"
        :key="`${item.x},${item.y}`"
        :x="item.x"
        :y="item.y"
        :tile="item.tile"
        :fog-state="item.fogState"
        :size="TILE_SIZE * zoom"
        :screen-x="worldToScreen(item.x, item.y).x"
        :screen-y="worldToScreen(item.x, item.y).y"
        :zoom="zoom"
        @click="handleTileClick"
        @hover="handleTileHover"
      />

      <!-- Wall and settlement overlays -->
      <WallOverlay
        v-if="showSettlements"
        :tile-size="TILE_SIZE"
        :zoom="zoom"
        :world-to-screen="worldToScreen"
        :visible-bounds="visibleTileRange"
      />

      <!-- Building overlay -->
      <BuildingOverlay
        :tile-size="TILE_SIZE"
        :zoom="zoom"
        :world-to-screen="worldToScreen"
        :visible-bounds="visibleTileRange"
        @building-click="handleBuildingClick"
      />

      <!-- Origin marker -->
      <circle
        :cx="worldToScreen(0, 0).x + (TILE_SIZE * zoom) / 2"
        :cy="worldToScreen(0, 0).y + (TILE_SIZE * zoom) / 2"
        :r="3 * zoom"
        fill="red"
        opacity="0.7"
      />
    </svg>

    <!-- Map controls -->
    <MapControls
      :zoom="zoom"
      :camera-x="cameraX"
      :camera-y="cameraY"
      :loaded-tile-count="loadedTileCount"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-view="handleResetView"
      @toggle-grid="toggleGrid"
      @toggle-settlements="toggleSettlements"
    />
  </div>
</template>
