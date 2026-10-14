<script setup lang="ts">
import { computed } from 'vue';
import { useBuildingsStore } from '@/stores/game/buildings';
import { useTurnStore } from '@/stores/game/turn';
import type { Coordinates } from '@/data/types';

interface Props {
  tileSize: number;
  zoom: number;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  visibleBounds: { minX: number; maxX: number; minY: number; maxY: number };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'buildingClick', coordinates: Coordinates): void;
}>();

const buildingsStore = useBuildingsStore();
const turnStore = useTurnStore();

// Building icon mapping
const BUILDING_ICONS: Record<string, string> = {
  // Infrastructure
  tent: '🏘️',
  hut: '🏠',
  house: '🏛️',

  // Production
  farm: '🌾',
  lumber_mill: '🪵',
  quarry: '🪨',
  mine: '⚙️',

  // Military
  barracks: '⚔️',
  archery_range: '🏹',
  stable: '🐴',
  training_ground: '🎯',

  // Walls
  wood_wall: '🪵',
  stone_wall: '🧱',

  // Gates
  wood_gate: '🚪',
  stone_gate: '🚪',
};

// Get construction icon
const CONSTRUCTION_ICON = '🚧';

// Get all buildings in visible area
const visibleBuildings = computed(() => {
  const { minX, maxX, minY, maxY } = props.visibleBounds;
  const playerId = turnStore.currentPlayerId;
  if (!playerId) return [];

  const buildings = buildingsStore.getPlayerBuildings(playerId);
  return buildings.filter(
    (building) =>
      building.coordinates.x >= minX &&
      building.coordinates.x <= maxX &&
      building.coordinates.y >= minY &&
      building.coordinates.y <= maxY,
  );
});

// Get all constructions in visible area
const visibleConstructions = computed(() => {
  const { minX, maxX, minY, maxY } = props.visibleBounds;
  const playerId = turnStore.currentPlayerId;
  if (!playerId) return [];

  const constructions = buildingsStore.getPlayerConstructionQueue(playerId);
  return constructions.filter(
    (construction) =>
      construction.coordinates.x >= minX &&
      construction.coordinates.x <= maxX &&
      construction.coordinates.y >= minY &&
      construction.coordinates.y <= maxY,
  );
});

function getBuildingIcon(buildingId: string): string {
  return BUILDING_ICONS[buildingId] || '🏗️';
}

function handleBuildingClick(coordinates: Coordinates) {
  emit('buildingClick', coordinates);
}

function getProgressPercentage(construction: { turnsRemaining: number; totalTurns: number }): number {
  return ((construction.totalTurns - construction.turnsRemaining) / construction.totalTurns) * 100;
}
</script>

<template>
  <!-- Completed Buildings -->
  <g v-for="building in visibleBuildings" :key="building.entityId">
    <g
      :transform="`translate(${worldToScreen(building.coordinates.x, building.coordinates.y).x}, ${worldToScreen(building.coordinates.x, building.coordinates.y).y})`"
      class="cursor-pointer"
      @click.stop="handleBuildingClick(building.coordinates)"
    >
      <!-- Building highlight background on hover -->
      <rect
        :width="tileSize * zoom"
        :height="tileSize * zoom"
        fill="yellow"
        opacity="0"
        class="transition-opacity hover:opacity-20"
      />

      <!-- Building icon -->
      <text
        :x="(tileSize * zoom) / 2"
        :y="(tileSize * zoom) / 2"
        :font-size="tileSize * zoom * 0.6"
        text-anchor="middle"
        dominant-baseline="middle"
        class="pointer-events-none select-none"
      >
        {{ getBuildingIcon(building.buildingId) }}
      </text>
    </g>
  </g>

  <!-- Buildings Under Construction -->
  <g v-for="construction in visibleConstructions" :key="construction.entityId">
    <g
      :transform="`translate(${worldToScreen(construction.coordinates.x, construction.coordinates.y).x}, ${worldToScreen(construction.coordinates.x, construction.coordinates.y).y})`"
    >
      <!-- Semi-transparent overlay -->
      <rect
        :width="tileSize * zoom"
        :height="tileSize * zoom"
        fill="black"
        opacity="0.3"
      />

      <!-- Construction icon (semi-transparent) -->
      <text
        :x="(tileSize * zoom) / 2"
        :y="(tileSize * zoom) / 3"
        :font-size="tileSize * zoom * 0.5"
        text-anchor="middle"
        dominant-baseline="middle"
        opacity="0.7"
        class="pointer-events-none select-none"
      >
        {{ CONSTRUCTION_ICON }}
      </text>

      <!-- Progress bar background -->
      <rect
        :x="tileSize * zoom * 0.1"
        :y="tileSize * zoom * 0.7"
        :width="tileSize * zoom * 0.8"
        :height="tileSize * zoom * 0.15"
        fill="black"
        opacity="0.5"
        rx="2"
      />

      <!-- Progress bar fill -->
      <rect
        :x="tileSize * zoom * 0.1"
        :y="tileSize * zoom * 0.7"
        :width="tileSize * zoom * 0.8 * (getProgressPercentage(construction) / 100)"
        :height="tileSize * zoom * 0.15"
        fill="green"
        opacity="0.8"
        rx="2"
      />

      <!-- Turns remaining text -->
      <text
        :x="(tileSize * zoom) / 2"
        :y="tileSize * zoom * 0.77"
        :font-size="tileSize * zoom * 0.12"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="white"
        class="pointer-events-none select-none"
      >
        {{ construction.turnsRemaining }}
      </text>
    </g>
  </g>
</template>
