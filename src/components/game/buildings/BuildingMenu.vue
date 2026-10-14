<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTurnStore } from '@/stores/game/turn';
import { useResourcesStore } from '@/stores/game/resources';
import { ALL_BUILDINGS, BuildingCategory, type BuildingDefinition } from '@/data/buildings';
import BuildingCard from './BuildingCard.vue';
import ConstructionQueue from './ConstructionQueue.vue';

const { t } = useI18n();
const turnStore = useTurnStore();
const resourcesStore = useResourcesStore();

const selectedBuilding = ref<BuildingDefinition | null>(null);
const activeCategory = ref<BuildingCategory | 'ALL'>('ALL');

const currentPlayerId = computed(() => turnStore.currentPlayerId);

const playerResources = computed(() => {
  if (!currentPlayerId.value) return null;
  return resourcesStore.getPlayerResources(currentPlayerId.value);
});

const categories = [
  { id: 'ALL' as const, label: 'All', icon: '🏗️' },
  { id: BuildingCategory.INFRASTRUCTURE, label: 'Housing', icon: '🏘️' },
  { id: BuildingCategory.PRODUCTION, label: 'Production', icon: '🏭' },
  { id: BuildingCategory.MILITARY, label: 'Military', icon: '⚔️' },
  { id: BuildingCategory.WALL, label: 'Walls', icon: '🧱' },
];

const filteredBuildings = computed(() => {
  if (activeCategory.value === 'ALL') {
    return ALL_BUILDINGS;
  }
  return ALL_BUILDINGS.filter((b) => b.category === activeCategory.value);
});

function canAffordBuilding(building: BuildingDefinition): boolean {
  if (!currentPlayerId.value || !playerResources.value) return false;

  const check = resourcesStore.checkCanAfford(currentPlayerId.value, building.cost);
  return check.canAfford;
}

function selectBuilding(building: BuildingDefinition) {
  if (!canAffordBuilding(building)) return;

  selectedBuilding.value = selectedBuilding.value?.id === building.id ? null : building;
  // Emit event to parent to enter placement mode
  if (selectedBuilding.value) {
    console.log('Selected building for placement:', building.id);
    // TODO: Enable placement mode in map
  }
}

defineExpose({
  selectedBuilding,
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <ConstructionQueue />

    <div class="rounded-lg bg-gray-800 p-4">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
        Available Buildings
      </h3>

      <!-- Category Tabs -->
      <div class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="activeCategory = category.id"
          class="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            activeCategory === category.id
              ? 'border-blue-500 bg-blue-500/20 text-blue-400'
              : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
          "
        >
          <span>{{ category.icon }}</span>
          <span>{{ category.label }}</span>
        </button>
      </div>

      <!-- Buildings Grid -->
      <div class="flex max-h-96 flex-col gap-2 overflow-y-auto">
        <BuildingCard
          v-for="building in filteredBuildings"
          :key="building.id"
          :building="building"
          :can-afford="canAffordBuilding(building)"
          :selected="selectedBuilding?.id === building.id"
          @select="selectBuilding(building)"
        />
      </div>

      <!-- Selected Building Info -->
      <div
        v-if="selectedBuilding"
        class="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-300"
      >
        <p class="font-semibold">✓ {{ t(selectedBuilding.nameKey) }} selected</p>
        <p class="mt-1 text-xs">Click on the map to place this building (costs 1 action + resources)</p>
      </div>
    </div>
  </div>
</template>
