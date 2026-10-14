<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBuildingsStore } from '@/stores/game/buildings';
import { usePeasantsStore } from '@/stores/game/peasants';
import { useResourcesStore } from '@/stores/game/resources';
import { useTurnStore } from '@/stores/game/turn';
import { useNotification } from '@/composables/useNotification';
import { getBuildingById, BuildingCategory } from '@/data/buildings';
import { AllocationTargetType, ActionType } from '@/data/types';
import { calculatePeasantEfficiency } from '@/data/config';
import type { Coordinates } from '@/data/types';
import PeasantAllocator from '@/components/game/peasants/PeasantAllocator.vue';

interface Props {
  coordinates: Coordinates;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const buildingsStore = useBuildingsStore();
const peasantsStore = usePeasantsStore();
const resourcesStore = useResourcesStore();
const turnStore = useTurnStore();
const { error, confirm } = useNotification();

const showPeasantAllocator = ref(false);

const building = computed(() => buildingsStore.getBuildingAt(props.coordinates));

const buildingDef = computed(() => {
  if (!building.value) return null;
  return getBuildingById(building.value.buildingId);
});

const currentPlayerId = computed(() => turnStore.currentPlayerId);

const allocation = computed(() => {
  if (!building.value || !currentPlayerId.value) return null;
  return peasantsStore.getAllocation(currentPlayerId.value, building.value.entityId);
});

const currentPeasantCount = computed(() => allocation.value?.peasantCount || 0);

const efficiency = computed(() => {
  if (!buildingDef.value?.peasantRequirement) return 1;
  return calculatePeasantEfficiency(
    currentPeasantCount.value,
    buildingDef.value.peasantRequirement,
  );
});

const efficiencyPercentage = computed(() => Math.round(efficiency.value * 100));

const productionAmount = computed(() => {
  if (!buildingDef.value?.production) return 0;
  return Math.floor(buildingDef.value.production.amountPerTurn * efficiency.value);
});

const isProductionBuilding = computed(
  () => buildingDef.value?.category === BuildingCategory.PRODUCTION,
);
const isInfrastructureBuilding = computed(
  () => buildingDef.value?.category === BuildingCategory.INFRASTRUCTURE,
);
const isMilitaryBuilding = computed(
  () => buildingDef.value?.category === BuildingCategory.MILITARY,
);

function handleDemolishClick() {
  if (!currentPlayerId.value || !buildingDef.value) return;

  // Check if player has actions
  if (!turnStore.canTakeAction(currentPlayerId.value, ActionType.BUILD)) {
    error(t('error.noActionsRemaining'));
    return;
  }

  // Build refund message
  let refundMessage = `Are you sure you want to demolish this ${t(buildingDef.value.nameKey)}?\n\nYou'll get 25% refund:`;
  if (buildingDef.value.cost) {
    Object.entries(buildingDef.value.cost).forEach(([resource, amount]) => {
      if (amount) {
        refundMessage += `\n${resource}: +${Math.floor(amount * 0.25)}`;
      }
    });
  }

  // Show confirmation
  confirm(
    refundMessage,
    () => {
      handleDemolish();
    },
    undefined,
    {
      confirmLabel: t('building.demolish'),
      cancelLabel: t('common.cancel'),
      type: useNotification().NotificationType.ERROR,
    },
  );
}

function handleDemolish() {
  if (!currentPlayerId.value) return;

  const result = buildingsStore.demolishBuilding(props.coordinates);
  if (!result) {
    error(t('error.cannotDemolish'));
    return;
  }

  // Release allocated peasants
  if (building.value && currentPlayerId.value) {
    peasantsStore.deallocatePeasants(currentPlayerId.value, building.value.entityId);
  }

  // Add refund resources
  if (result.refund && currentPlayerId.value) {
    resourcesStore.addResources(
      currentPlayerId.value,
      result.refund,
      `Demolish ${buildingDef.value?.nameKey || 'building'}`,
      turnStore.turnNumber,
    );
  }

  // Spend action
  turnStore.spendActions(currentPlayerId.value, ActionType.BUILD, 1);

  // Auto-save after demolish
  import('@/stores/game').then(({ useGameStore }) => {
    console.log('💥 Building demolished, triggering auto-save...');
    const gameStore = useGameStore();
    gameStore.saveGame();
  });

  emit('close');
}

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

function openPeasantAllocator() {
  showPeasantAllocator.value = true;
}

function closePeasantAllocator() {
  showPeasantAllocator.value = false;
}
</script>

<template>
  <div
    v-if="building && buildingDef"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- Background overlay -->
    <div class="absolute inset-0 bg-black opacity-70"></div>

    <!-- Dialog content -->
    <div
      class="relative max-h-screen w-full max-w-lg overflow-y-auto rounded-lg bg-gray-800 text-white shadow-xl"
    >
      <!-- Header -->
      <div class="border-b border-gray-700 bg-gray-900 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-4xl">{{ getBuildingIcon(building.buildingId) }}</span>
            <div>
              <h2 class="text-xl font-bold">{{ t(buildingDef.nameKey) }}</h2>
              <p class="text-sm text-gray-400">
                Level {{ building.level }} • ({{ coordinates.x }}, {{ coordinates.y }})
              </p>
            </div>
          </div>
          <button
            class="rounded px-3 py-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
        <p class="mt-2 text-sm text-gray-300">{{ t(buildingDef.descriptionKey) }}</p>
      </div>

      <!-- Body -->
      <div class="space-y-4 p-4">
        <!-- Production Building Info -->
        <div v-if="isProductionBuilding && buildingDef.production" class="space-y-3">
          <div class="rounded-lg bg-gray-900 p-3">
            <h3 class="mb-2 font-semibold text-green-400">Production</h3>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-300">
                {{ getResourceIcon(buildingDef.production.resourceType) }}
                {{ buildingDef.production.resourceType }}
              </span>
              <span class="font-bold text-green-400"> +{{ productionAmount }} / turn </span>
            </div>
            <div class="mt-2 text-xs text-gray-400">
              Base: {{ buildingDef.production.amountPerTurn }} / turn at 100% efficiency
            </div>
          </div>

          <!-- Peasant Allocation -->
          <div class="rounded-lg bg-gray-900 p-3">
            <div class="mb-2 flex items-center justify-between">
              <h3 class="font-semibold text-yellow-400">Peasant Allocation</h3>
              <button
                class="rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700"
                @click="openPeasantAllocator"
              >
                Manage
              </button>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-300">Current:</span>
                <span class="text-white">{{ currentPeasantCount }} peasants</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Required (100%):</span>
                <span class="text-white">{{ buildingDef.peasantRequirement }} peasants</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Efficiency:</span>
                <span
                  :class="{
                    'text-green-400': efficiencyPercentage >= 100,
                    'text-yellow-400': efficiencyPercentage >= 75 && efficiencyPercentage < 100,
                    'text-orange-400': efficiencyPercentage >= 50 && efficiencyPercentage < 75,
                    'text-red-400': efficiencyPercentage > 0 && efficiencyPercentage < 50,
                    'text-gray-500': efficiencyPercentage === 0,
                  }"
                  class="font-bold"
                >
                  {{ efficiencyPercentage }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Infrastructure Building Info -->
        <div
          v-if="isInfrastructureBuilding && buildingDef.peasantGeneration"
          class="rounded-lg bg-gray-900 p-3"
        >
          <h3 class="mb-2 font-semibold text-blue-400">Infrastructure</h3>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-300">Generates peasants:</span>
            <span class="font-bold text-blue-400">+{{ buildingDef.peasantGeneration }}</span>
          </div>
        </div>

        <!-- Military Building Info -->
        <div v-if="isMilitaryBuilding" class="rounded-lg bg-gray-900 p-3">
          <h3 class="mb-2 font-semibold text-red-400">Military</h3>
          <div class="space-y-1 text-sm">
            <div v-if="buildingDef.soldierCapacity" class="flex justify-between">
              <span class="text-gray-300">Soldier capacity:</span>
              <span class="text-white">0 / {{ buildingDef.soldierCapacity }}</span>
            </div>
            <div v-if="buildingDef.canHoldMountedUnits !== undefined" class="flex justify-between">
              <span class="text-gray-300">Can hold cavalry:</span>
              <span class="text-white">{{ buildingDef.canHoldMountedUnits ? 'Yes' : 'No' }}</span>
            </div>
            <div v-if="buildingDef.trainsUnits && buildingDef.trainsUnits.length > 0">
              <span class="text-gray-300">Can train:</span>
              <div class="mt-1 text-xs text-gray-400">
                {{ buildingDef.trainsUnits.join(', ') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="border-t border-gray-700 bg-gray-900 p-4">
        <div class="flex gap-2">
          <button
            class="flex-1 rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
            @click="emit('close')"
          >
            Close
          </button>
          <button
            class="rounded bg-red-600 px-4 py-2 hover:bg-red-700 disabled:opacity-50"
            @click="handleDemolishClick"
          >
            Demolish
          </button>
        </div>
      </div>
    </div>

    <!-- Peasant Allocator Modal -->
    <PeasantAllocator
      v-if="showPeasantAllocator && building && buildingDef && buildingDef.peasantRequirement"
      :target-id="building.entityId"
      :target-type="AllocationTargetType.BUILDING"
      :coordinates="coordinates"
      :required-for-optimal="buildingDef.peasantRequirement"
      :label="t(buildingDef.nameKey)"
      @close="closePeasantAllocator"
    />
  </div>
</template>
