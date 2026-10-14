<script setup lang="ts">
import { computed } from 'vue';
import type { Tile, FogState } from '@/data/types';
import { FogState as FogStateEnum, TerrainType } from '@/data/types';
import { getBuildingById } from '@/data/buildings';

interface Props {
  x: number;
  y: number;
  tile: Tile | null;
  fogState: FogState;
  size: number; // Tile size in pixels
  screenX: number; // Screen position
  screenY: number;
  zoom: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [x: number, y: number];
  hover: [x: number, y: number];
}>();

// Terrain colors
const terrainColor = computed(() => {
  if (!props.tile) return '#1f2937'; // gray-800 for unknown

  switch (props.tile.terrain) {
    case TerrainType.GRASSLAND:
      return '#4ade80'; // green-400
    case TerrainType.FOREST:
      return '#22c55e'; // green-600
    case TerrainType.MOUNTAIN:
      return '#71717a'; // zinc-500
    case TerrainType.WATER:
      return '#3b82f6'; // blue-500
    case TerrainType.WASTELAND:
      return '#78716c'; // stone-500
    case TerrainType.DESERT:
      return '#fbbf24'; // amber-400
    default:
      return '#6b7280'; // gray-500
  }
});

// Building info
const buildingInfo = computed(() => {
  if (!props.tile?.building) return null;
  const def = getBuildingById(props.tile.building.buildingId);
  return {
    def,
    instance: props.tile.building,
  };
});

// Building color
const buildingColor = computed(() => {
  if (!buildingInfo.value) return undefined;

  const { def } = buildingInfo.value;

  // Wall colors
  if (def?.isWall) {
    return def.wallMaterial === 'WOOD' ? '#92400e' : '#57534e'; // brown-800 or stone-600
  }

  // Gate colors
  if (def?.isGate) {
    return def.wallMaterial === 'WOOD' ? '#a16207' : '#78716c'; // amber-700 or stone-500
  }

  // Production buildings
  if (def?.production) {
    return '#166534'; // green-800
  }

  // Military buildings
  if (def?.canHoldSoldiers) {
    return '#991b1b'; // red-800
  }

  // Infrastructure
  return '#1e40af'; // blue-800
});

// Resource deposit indicator
const hasResourceDeposit = computed(() => {
  return props.tile?.resourceDeposit && !props.tile.resourceDeposit.depleted;
});

const resourceDepositColor = computed(() => {
  if (!props.tile?.resourceDeposit) return undefined;

  switch (props.tile.resourceDeposit.type) {
    case 'FOOD':
      return '#86efac'; // green-300
    case 'WOOD':
      return '#a16207'; // amber-700
    case 'STONE':
      return '#a8a29e'; // stone-400
    case 'IRON':
      return '#9ca3af'; // gray-400
    default:
      return '#fbbf24'; // amber-400
  }
});

// Fog overlay
const fogOverlay = computed(() => {
  switch (props.fogState) {
    case FogStateEnum.UNEXPLORED:
      return 'rgba(0, 0, 0, 0.95)'; // Almost black
    case FogStateEnum.EXPLORED:
      return 'rgba(0, 0, 0, 0.6)'; // Grey fog
    case FogStateEnum.VISIBLE:
      return 'rgba(0, 0, 0, 0)'; // No fog
    default:
      return 'rgba(0, 0, 0, 0.95)';
  }
});

// Should show details
const showDetails = computed(() => {
  return props.fogState !== FogStateEnum.UNEXPLORED && props.zoom >= 0.8;
});

// Soldier count
const soldierCount = computed(() => {
  return props.tile?.soldiers?.totalCount || 0;
});

function handleClick() {
  emit('click', props.x, props.y);
}

function handleHover() {
  emit('hover', props.x, props.y);
}
</script>

<template>
  <g
    :transform="`translate(${screenX}, ${screenY})`"
    class="tile-group"
    @click="handleClick"
    @mouseenter="handleHover"
  >
    <!-- Terrain base -->
    <rect
      v-if="tile"
      :width="size"
      :height="size"
      :fill="terrainColor"
      stroke="#374151"
      :stroke-width="0.5 * zoom"
      class="transition-colors duration-150"
    />

    <!-- Unknown tile (no data) -->
    <rect
      v-else
      :width="size"
      :height="size"
      fill="#1f2937"
      stroke="#374151"
      :stroke-width="0.5 * zoom"
    />

    <!-- Resource deposit indicator (bottom-right corner) -->
    <circle
      v-if="showDetails && hasResourceDeposit"
      :cx="size * 0.8"
      :cy="size * 0.8"
      :r="size * 0.1"
      :fill="resourceDepositColor"
      :stroke="'#000'"
      :stroke-width="0.5 * zoom"
      opacity="0.9"
    />

    <!-- Building -->
    <rect
      v-if="showDetails && buildingInfo"
      :x="size * 0.1"
      :y="size * 0.1"
      :width="size * 0.8"
      :height="size * 0.8"
      :fill="buildingColor"
      :stroke="'#000'"
      :stroke-width="1 * zoom"
      opacity="0.85"
      :rx="buildingInfo.def?.isWall || buildingInfo.def?.isGate ? 0 : size * 0.05"
    />

    <!-- Building icon/indicator -->
    <text
      v-if="showDetails && buildingInfo && zoom >= 1.0"
      :x="size / 2"
      :y="size / 2"
      text-anchor="middle"
      dominant-baseline="middle"
      :font-size="10 * zoom"
      fill="white"
      class="pointer-events-none select-none"
    >
      <!-- Wall/Gate symbols -->
      <template v-if="buildingInfo.def?.isWall">■</template>
      <template v-else-if="buildingInfo.def?.isGate">▣</template>
      <!-- Other building types -->
      <template v-else-if="buildingInfo.def?.production">🌾</template>
      <template v-else-if="buildingInfo.def?.canHoldSoldiers">⚔️</template>
      <template v-else>🏠</template>
    </text>

    <!-- Soldier count badge -->
    <g v-if="showDetails && soldierCount > 0">
      <circle
        :cx="size * 0.2"
        :cy="size * 0.2"
        :r="size * 0.12"
        fill="#991b1b"
        :stroke="'#000'"
        :stroke-width="0.5 * zoom"
      />
      <text
        :x="size * 0.2"
        :y="size * 0.2"
        text-anchor="middle"
        dominant-baseline="middle"
        :font-size="8 * zoom"
        fill="white"
        class="pointer-events-none select-none font-bold"
      >
        {{ soldierCount }}
      </text>
    </g>

    <!-- Fog of war overlay -->
    <rect
      :width="size"
      :height="size"
      :fill="fogOverlay"
      class="pointer-events-none transition-opacity duration-300"
    />

    <!-- Coordinates (debug, only at high zoom) -->
    <text
      v-if="zoom >= 1.5 && fogState !== FogStateEnum.UNEXPLORED"
      :x="size / 2"
      :y="size - 3 * zoom"
      text-anchor="middle"
      :font-size="6 * zoom"
      fill="white"
      opacity="0.4"
      class="pointer-events-none select-none"
    >
      {{ x }},{{ y }}
    </text>
  </g>
</template>

<style scoped>
.tile-group {
  cursor: pointer;
  transition: opacity 0.2s;
}

.tile-group:hover {
  opacity: 0.9;
}
</style>
