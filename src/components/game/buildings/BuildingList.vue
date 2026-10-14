<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBuildingsStore } from '@/stores/game/buildings';
import { usePeasantsStore } from '@/stores/game/peasants';
import { useTurnStore } from '@/stores/game/turn';
import { getBuildingById, BuildingCategory } from '@/data/buildings';
import { calculatePeasantEfficiency } from '@/data/config';
import type { Coordinates } from '@/data/types';

const emit = defineEmits<{
  (e: 'buildingClick', coordinates: Coordinates): void;
  (e: 'panTo', coordinates: Coordinates): void;
}>();

const { t } = useI18n();
const buildingsStore = useBuildingsStore();
const peasantsStore = usePeasantsStore();
const turnStore = useTurnStore();

const selectedCategory = ref<BuildingCategory | 'ALL'>('ALL');
const sortBy = ref<'location' | 'type' | 'efficiency'>('type');

const buildings = computed(() => {
  const playerId = turnStore.currentPlayerId;
  if (!playerId) return [];
  return buildingsStore.getPlayerBuildings(playerId);
});

const buildingsWithDetails = computed(() => {
  return buildings.value.map((building) => {
    const definition = getBuildingById(building.buildingId);
    const allocation = peasantsStore.getAllocation(
      turnStore.currentPlayerId!,
      building.entityId,
    );
    const peasantCount = allocation?.peasantCount || 0;
    const efficiency = definition?.peasantRequirement
      ? calculatePeasantEfficiency(peasantCount, definition.peasantRequirement)
      : 1;

    return {
      building,
      definition,
      peasantCount,
      efficiency,
    };
  });
});

const filteredBuildings = computed(() => {
  let filtered = buildingsWithDetails.value;

  // Filter by category
  if (selectedCategory.value !== 'ALL') {
    filtered = filtered.filter(
      (b) => b.definition?.category === selectedCategory.value,
    );
  }

  // Sort
  if (sortBy.value === 'location') {
    filtered.sort((a, b) => {
      if (a.building.coordinates.y !== b.building.coordinates.y) {
        return a.building.coordinates.y - b.building.coordinates.y;
      }
      return a.building.coordinates.x - b.building.coordinates.x;
    });
  } else if (sortBy.value === 'type') {
    filtered.sort((a, b) => {
      const aType = a.definition?.id || '';
      const bType = b.definition?.id || '';
      return aType.localeCompare(bType);
    });
  } else if (sortBy.value === 'efficiency') {
    filtered.sort((a, b) => b.efficiency - a.efficiency);
  }

  return filtered;
});

const categoryStats = computed(() => {
  const stats = {
    ALL: 0,
    [BuildingCategory.INFRASTRUCTURE]: 0,
    [BuildingCategory.PRODUCTION]: 0,
    [BuildingCategory.MILITARY]: 0,
    [BuildingCategory.WALL]: 0,
    [BuildingCategory.GATE]: 0,
  };

  for (const { definition } of buildingsWithDetails.value) {
    if (definition) {
      stats.ALL++;
      stats[definition.category]++;
    }
  }

  return stats;
});

function getBuildingIcon(buildingId: string): string {
  const icons: Record<string, string> = {
    tent: '🏘️',
    hut: '🏠',
    house: '🏛️',
    farm: '🌾',
    lumber_mill: '🪵',
    quarry: '🪨',
    mine: '⚙️',
    barracks: '⚔️',
    archery_range: '🏹',
    stable: '🐴',
    training_ground: '🎯',
    wooden_wall: '🧱',
    stone_wall: '🧱',
    wooden_gate: '🚪',
    stone_gate: '🚪',
  };
  return icons[buildingId] || '🏗️';
}

function getResourceIcon(resourceType: string): string {
  const icons: Record<string, string> = {
    FOOD: '🌾',
    WOOD: '🪵',
    STONE: '🪨',
    IRON: '⚙️',
  };
  return icons[resourceType] || '❓';
}

function getEfficiencyColor(efficiency: number): string {
  const percentage = efficiency * 100;
  if (percentage >= 100) return 'text-green-400';
  if (percentage >= 75) return 'text-yellow-400';
  if (percentage >= 50) return 'text-orange-400';
  if (percentage > 0) return 'text-red-400';
  return 'text-gray-500';
}

function handleBuildingClick(coordinates: Coordinates) {
  emit('buildingClick', coordinates);
}

function handlePanTo(coordinates: Coordinates) {
  emit('panTo', coordinates);
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <div class="border-b border-gray-700 p-3">
      <h2 class="text-lg font-bold text-white">My Buildings</h2>
      <p class="text-sm text-gray-400">{{ buildings.length }} total</p>
    </div>

    <!-- Category Filter -->
    <div class="border-b border-gray-700 p-2">
      <div class="flex flex-wrap gap-1">
        <button
          @click="selectedCategory = 'ALL'"
          :class="
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
          class="rounded px-2 py-1 text-xs"
        >
          All ({{ categoryStats.ALL }})
        </button>
        <button
          @click="selectedCategory = BuildingCategory.INFRASTRUCTURE"
          :class="
            selectedCategory === BuildingCategory.INFRASTRUCTURE
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
          class="rounded px-2 py-1 text-xs"
        >
          🏘️ ({{ categoryStats[BuildingCategory.INFRASTRUCTURE] }})
        </button>
        <button
          @click="selectedCategory = BuildingCategory.PRODUCTION"
          :class="
            selectedCategory === BuildingCategory.PRODUCTION
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
          class="rounded px-2 py-1 text-xs"
        >
          🌾 ({{ categoryStats[BuildingCategory.PRODUCTION] }})
        </button>
        <button
          @click="selectedCategory = BuildingCategory.MILITARY"
          :class="
            selectedCategory === BuildingCategory.MILITARY
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
          class="rounded px-2 py-1 text-xs"
        >
          ⚔️ ({{ categoryStats[BuildingCategory.MILITARY] }})
        </button>
      </div>
    </div>

    <!-- Sort Options -->
    <div class="border-b border-gray-700 p-2">
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">Sort:</span>
        <select
          v-model="sortBy"
          class="flex-1 rounded bg-gray-700 px-2 py-1 text-xs text-white"
        >
          <option value="type">Type</option>
          <option value="location">Location</option>
          <option value="efficiency">Efficiency</option>
        </select>
      </div>
    </div>

    <!-- Building List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="filteredBuildings.length === 0" class="p-4 text-center text-gray-400">
        <p>No buildings found</p>
      </div>
      <div v-else class="space-y-2 p-2">
        <div
          v-for="{ building, definition, peasantCount, efficiency } in filteredBuildings"
          :key="building.entityId"
          class="rounded-lg bg-gray-800 p-3 hover:bg-gray-750"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-2">
              <span class="text-2xl">{{ getBuildingIcon(building.buildingId) }}</span>
              <div class="flex-1">
                <div class="font-semibold text-white">
                  {{ definition ? t(definition.nameKey) : building.buildingId }}
                </div>
                <div class="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <button
                    @click="handlePanTo(building.coordinates)"
                    class="hover:text-blue-400 hover:underline"
                  >
                    ({{ building.coordinates.x }}, {{ building.coordinates.y }})
                  </button>
                  <span>•</span>
                  <span>Level {{ building.level }}</span>
                </div>

                <!-- Production Info -->
                <div v-if="definition?.production" class="mt-2 space-y-1">
                  <div class="flex items-center gap-2 text-xs">
                    <span class="text-gray-400">Production:</span>
                    <span class="text-green-400">
                      {{ getResourceIcon(definition.production.resourceType) }}
                      +{{ Math.floor(definition.production.amountPerTurn * efficiency) }}/turn
                    </span>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="text-gray-400">Peasants:</span>
                    <span class="text-white">
                      {{ peasantCount }} / {{ definition.peasantRequirement }}
                    </span>
                    <span :class="getEfficiencyColor(efficiency)">
                      ({{ Math.round(efficiency * 100) }}%)
                    </span>
                  </div>
                </div>

                <!-- Infrastructure Info -->
                <div v-if="definition?.peasantGeneration" class="mt-2 text-xs">
                  <span class="text-gray-400">Generates:</span>
                  <span class="text-blue-400">
                    +{{ definition.peasantGeneration }} peasants
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-2 flex gap-2">
            <button
              @click="handleBuildingClick(building.coordinates)"
              class="flex-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
