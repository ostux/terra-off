<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BuildingDefinition } from '@/data/buildings';
import { BuildingCategory } from '@/data/buildings';
import ResourceIcon from '@/components/game/resources/ResourceIcon.vue';
import { ResourceType } from '@/data/types';

interface Props {
  building: BuildingDefinition;
  canAfford?: boolean;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canAfford: true,
  selected: false,
});

const emit = defineEmits<{
  (e: 'select'): void;
}>();

const { t } = useI18n();

const categoryIcon = computed(() => {
  switch (props.building.category) {
    case BuildingCategory.INFRASTRUCTURE:
      return '🏘️';
    case BuildingCategory.PRODUCTION:
      return '🏭';
    case BuildingCategory.MILITARY:
      return '⚔️';
    case BuildingCategory.WALL:
      return '🧱';
    case BuildingCategory.GATE:
      return '🚪';
    default:
      return '🏗️';
  }
});

const categoryColor = computed(() => {
  switch (props.building.category) {
    case BuildingCategory.INFRASTRUCTURE:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case BuildingCategory.PRODUCTION:
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case BuildingCategory.MILITARY:
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case BuildingCategory.WALL:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case BuildingCategory.GATE:
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
});

const costEntries = computed(() => {
  return Object.entries(props.building.cost).filter(([, amount]) => amount > 0);
});

function handleClick() {
  if (props.canAfford) {
    emit('select');
  }
}
</script>

<template>
  <div
    @click="handleClick"
    class="group cursor-pointer rounded-lg border transition-all"
    :class="[
      selected
        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
        : canAfford
          ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700'
          : 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-50',
    ]"
  >
    <div class="p-4">
      <!-- Header -->
      <div class="mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ categoryIcon }}</span>
          <div>
            <h3 class="font-bold text-white">
              {{ t(building.nameKey) }}
            </h3>
            <div class="mt-0.5 flex items-center gap-2">
              <span
                class="rounded border px-1.5 py-0.5 text-xs font-medium uppercase"
                :class="categoryColor"
              >
                {{ building.category }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <p class="mb-3 text-sm text-gray-300">
        {{ t(building.descriptionKey) }}
      </p>

      <!-- Stats -->
      <div class="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div v-if="building.constructionTurns" class="rounded bg-gray-800/50 px-2 py-1">
          <div class="text-gray-400">Build Time</div>
          <div class="font-semibold text-white">{{ building.constructionTurns }} turns</div>
        </div>

        <div v-if="building.peasantGeneration" class="rounded bg-gray-800/50 px-2 py-1">
          <div class="text-gray-400">Peasants</div>
          <div class="font-semibold text-green-400">+{{ building.peasantGeneration }}</div>
        </div>

        <div v-if="building.peasantRequirement" class="rounded bg-gray-800/50 px-2 py-1">
          <div class="text-gray-400">Requires</div>
          <div class="font-semibold text-yellow-400">{{ building.peasantRequirement }} peasants</div>
        </div>

        <div v-if="building.production" class="rounded bg-gray-800/50 px-2 py-1">
          <div class="text-gray-400">Produces</div>
          <div class="flex items-center gap-1 font-semibold">
            <ResourceIcon :resource-type="building.production.resourceType" size="sm" />
            <span class="text-white">{{ building.production.amountPerTurn }}/turn</span>
          </div>
        </div>

        <div v-if="building.soldierCapacity" class="rounded bg-gray-800/50 px-2 py-1">
          <div class="text-gray-400">Capacity</div>
          <div class="font-semibold text-red-400">{{ building.soldierCapacity }} soldiers</div>
        </div>

        <div v-if="building.visionRadius" class="rounded bg-gray-800/50 px-2 py-1">
          <div class="text-gray-400">Vision</div>
          <div class="font-semibold text-blue-400">{{ building.visionRadius }} tiles</div>
        </div>
      </div>

      <!-- Cost -->
      <div class="border-t border-gray-600 pt-3">
        <div class="mb-1 text-xs font-medium text-gray-400">Cost:</div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="[resource, amount] in costEntries"
            :key="resource"
            class="flex items-center gap-1"
          >
            <ResourceIcon :resource-type="resource as ResourceType" :amount="amount" size="sm" />
          </div>
          <div v-if="costEntries.length === 0" class="text-sm text-gray-500">
            Free
          </div>
        </div>
      </div>

      <!-- Can't Afford Warning -->
      <div v-if="!canAfford" class="mt-3 rounded bg-red-500/20 px-2 py-1 text-xs text-red-400">
        ⚠️ Insufficient resources
      </div>
    </div>
  </div>
</template>
