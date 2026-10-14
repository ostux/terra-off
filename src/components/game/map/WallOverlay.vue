<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettlementsStore } from '@/stores/game/settlements';
import type { Settlement, Coordinates } from '@/data/types';
import { SettlementType, fromTileKey } from '@/data/types';

interface Props {
  tileSize: number;
  zoom: number;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  visibleBounds: { minX: number; maxX: number; minY: number; maxY: number };
}

const props = defineProps<Props>();
const settlementsStore = useSettlementsStore();
const { t } = useI18n();

// Get all settlements
const allSettlements = computed(() => settlementsStore.getAllSettlements());

// Filter settlements visible in viewport
const visibleSettlements = computed(() => {
  return allSettlements.value.filter((settlement) => {
    // Check if any interior tile is in visible bounds
    return settlement.interiorTiles.some((tileKey) => {
      const coords = fromTileKey(tileKey);
      return (
        coords.x >= props.visibleBounds.minX &&
        coords.x <= props.visibleBounds.maxX &&
        coords.y >= props.visibleBounds.minY &&
        coords.y <= props.visibleBounds.maxY
      );
    });
  });
});

// Settlement boundary color
function getSettlementColor(settlement: Settlement): string {
  return settlement.type === SettlementType.VILLAGE ? '#fbbf24' : '#a855f7'; // amber or purple
}

// Get settlement center (for label)
function getSettlementCenter(settlement: Settlement): Coordinates {
  const coords = settlement.interiorTiles.map(fromTileKey);
  const sumX = coords.reduce((sum, c) => sum + c.x, 0);
  const sumY = coords.reduce((sum, c) => sum + c.y, 0);

  return {
    x: sumX / coords.length,
    y: sumY / coords.length,
  };
}

// Calculate boundary path for settlement highlight
function getSettlementBoundaryPath(settlement: Settlement): string {
  // For now, just draw a simple polygon around interior tiles
  // In production, you'd want a proper convex hull or boundary tracing algorithm

  const interiorCoords = settlement.interiorTiles.map(fromTileKey);
  if (interiorCoords.length === 0) return '';

  // Find bounding box
  const minX = Math.min(...interiorCoords.map((c) => c.x));
  const maxX = Math.max(...interiorCoords.map((c) => c.x));
  const minY = Math.min(...interiorCoords.map((c) => c.y));
  const maxY = Math.max(...interiorCoords.map((c) => c.y));

  // Create rectangle path around boundary
  const topLeft = props.worldToScreen(minX - 0.5, minY - 0.5);
  const topRight = props.worldToScreen(maxX + 0.5, minY - 0.5);
  const bottomRight = props.worldToScreen(maxX + 0.5, maxY + 0.5);
  const bottomLeft = props.worldToScreen(minX - 0.5, maxY + 0.5);

  return `M ${topLeft.x} ${topLeft.y} L ${topRight.x} ${topRight.y} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`;
}
</script>

<template>
  <g class="wall-overlay">
    <!-- Settlement boundaries -->
    <g v-for="settlement in visibleSettlements" :key="settlement.settlementId">
      <!-- Settlement boundary highlight -->
      <path
        :d="getSettlementBoundaryPath(settlement)"
        fill="none"
        :stroke="getSettlementColor(settlement)"
        :stroke-width="3 * zoom"
        stroke-dasharray="10,5"
        opacity="0.6"
        class="settlement-boundary"
      />

      <!-- Settlement name label (only at reasonable zoom) -->
      <g v-if="zoom >= 0.8">
        <template v-if="settlement.type === SettlementType.VILLAGE">
          <!-- Village label -->
          <text
            :x="worldToScreen(getSettlementCenter(settlement).x, getSettlementCenter(settlement).y).x"
            :y="worldToScreen(getSettlementCenter(settlement).x, getSettlementCenter(settlement).y).y - 10 * zoom"
            text-anchor="middle"
            :font-size="14 * zoom"
            fill="#fbbf24"
            stroke="#000"
            :stroke-width="2 * zoom"
            paint-order="stroke"
            class="font-bold"
          >
            🏘️ {{ settlement.name }}
          </text>
        </template>
        <template v-else>
          <!-- City label -->
          <text
            :x="worldToScreen(getSettlementCenter(settlement).x, getSettlementCenter(settlement).y).x"
            :y="worldToScreen(getSettlementCenter(settlement).x, getSettlementCenter(settlement).y).y - 10 * zoom"
            text-anchor="middle"
            :font-size="16 * zoom"
            fill="#a855f7"
            stroke="#000"
            :stroke-width="2 * zoom"
            paint-order="stroke"
            class="font-bold"
          >
            🏛️ {{ settlement.name }}
          </text>
        </template>

        <!-- Settlement stats (only at high zoom) -->
        <g v-if="zoom >= 1.2">
          <text
            :x="worldToScreen(getSettlementCenter(settlement).x, getSettlementCenter(settlement).y).x"
            :y="worldToScreen(getSettlementCenter(settlement).x, getSettlementCenter(settlement).y).y + 8 * zoom"
            text-anchor="middle"
            :font-size="10 * zoom"
            fill="white"
            opacity="0.8"
            class="select-none"
          >
            {{ t('settlement.area') }}: {{ settlement.area }} |
            {{ t('settlement.buildings') }}: {{ settlement.buildingCount }}
          </text>
        </g>
      </g>
    </g>

    <!-- Current detected loops (for debugging invalid loops) -->
    <g v-if="zoom >= 1.0" class="debug-loops">
      <g v-for="(loop, idx) in settlementsStore.getInvalidLoops()" :key="`invalid-${idx}`">
        <!-- Show invalid loops in red -->
        <rect
          v-for="wallKey in loop.wallTiles"
          :key="`wall-${wallKey}`"
          :x="worldToScreen(fromTileKey(wallKey).x, fromTileKey(wallKey).y).x"
          :y="worldToScreen(fromTileKey(wallKey).x, fromTileKey(wallKey).y).y"
          :width="tileSize * zoom"
          :height="tileSize * zoom"
          fill="none"
          stroke="red"
          :stroke-width="2 * zoom"
          opacity="0.5"
        />
      </g>
    </g>
  </g>
</template>

<style scoped>
.settlement-boundary {
  pointer-events: none;
  animation: dash 30s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -1000;
  }
}
</style>
