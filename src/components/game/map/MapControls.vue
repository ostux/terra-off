<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  zoom: number;
  cameraX: number;
  cameraY: number;
  loadedTileCount: number;
}

defineProps<Props>();

const emit = defineEmits<{
  zoomIn: [];
  zoomOut: [];
  resetView: [];
  toggleGrid: [];
  toggleSettlements: [];
}>();

const { t } = useI18n();

const showGrid = ref(true);
const showSettlements = ref(true);

function handleZoomIn() {
  emit('zoomIn');
}

function handleZoomOut() {
  emit('zoomOut');
}

function handleResetView() {
  emit('resetView');
}

function toggleGrid() {
  showGrid.value = !showGrid.value;
  emit('toggleGrid');
}

function toggleSettlements() {
  showSettlements.value = !showSettlements.value;
  emit('toggleSettlements');
}
</script>

<template>
  <div class="map-controls">
    <!-- Zoom controls (right side) -->
    <div class="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2">
      <!-- Zoom in -->
      <button
        class="rounded-lg bg-gray-800/90 p-3 text-white shadow-lg transition-colors hover:bg-gray-700"
        :title="t('map.controls.zoomIn')"
        @click="handleZoomIn"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      <!-- Zoom out -->
      <button
        class="rounded-lg bg-gray-800/90 p-3 text-white shadow-lg transition-colors hover:bg-gray-700"
        :title="t('map.controls.zoomOut')"
        @click="handleZoomOut"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>

      <!-- Reset view -->
      <button
        class="rounded-lg bg-gray-800/90 p-3 text-white shadow-lg transition-colors hover:bg-gray-700"
        :title="t('map.controls.resetView')"
        @click="handleResetView"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </button>
    </div>

    <!-- View options (top left) -->
    <div class="absolute left-4 top-4 flex flex-col gap-2">
      <!-- Toggle grid -->
      <button
        class="rounded-lg bg-gray-800/90 px-4 py-2 text-sm text-white shadow-lg transition-colors hover:bg-gray-700"
        :class="{ 'ring-2 ring-blue-500': showGrid }"
        @click="toggleGrid"
      >
        {{ showGrid ? '✓' : '○' }} {{ t('map.controls.grid') }}
      </button>

      <!-- Toggle settlements -->
      <button
        class="rounded-lg bg-gray-800/90 px-4 py-2 text-sm text-white shadow-lg transition-colors hover:bg-gray-700"
        :class="{ 'ring-2 ring-blue-500': showSettlements }"
        @click="toggleSettlements"
      >
        {{ showSettlements ? '✓' : '○' }} {{ t('map.controls.settlements') }}
      </button>
    </div>

    <!-- Info panel (bottom left) -->
    <div class="absolute bottom-4 left-4 rounded-lg bg-gray-800/90 p-3 text-xs text-white shadow-lg">
      <div class="mb-1 font-bold text-gray-300">{{ t('map.info.title') }}</div>
      <div class="space-y-0.5">
        <div>
          {{ t('map.info.camera') }}: {{ cameraX.toFixed(1) }}, {{ cameraY.toFixed(1) }}
        </div>
        <div>{{ t('map.info.zoom') }}: {{ (zoom * 100).toFixed(0) }}%</div>
        <div>{{ t('map.info.tiles') }}: {{ loadedTileCount }}</div>
      </div>
    </div>

    <!-- Help text (bottom right) -->
    <div class="absolute bottom-4 right-4 rounded-lg bg-gray-800/90 p-3 text-xs text-gray-300 shadow-lg">
      <div class="mb-1 font-bold">{{ t('map.help.title') }}</div>
      <div class="space-y-0.5">
        <div>🖱️ {{ t('map.help.pan') }}</div>
        <div>🔍 {{ t('map.help.zoom') }}</div>
        <div>👆 {{ t('map.help.click') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-controls {
  pointer-events: none;
}

.map-controls button {
  pointer-events: auto;
}
</style>
