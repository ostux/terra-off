<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePeasantsStore } from '@/stores/game/peasants';
import { useTurnStore } from '@/stores/game/turn';
import type { EntityId, Coordinates, AllocationTargetType } from '@/data/types';
import { calculatePeasantEfficiency } from '@/data/config';

interface Props {
  /** Target entity ID (building or resource) */
  targetId: EntityId;
  /** Type of target */
  targetType: AllocationTargetType;
  /** Coordinates of target */
  coordinates: Coordinates;
  /** Number of peasants required for 100% efficiency */
  requiredForOptimal: number;
  /** Target label for display */
  label?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const peasantsStore = usePeasantsStore();
const turnStore = useTurnStore();

const currentPlayerId = computed(() => turnStore.currentPlayerId);

const currentAllocation = computed(() => {
  if (!currentPlayerId.value) return null;
  return peasantsStore.getAllocation(currentPlayerId.value, props.targetId);
});

const peasantState = computed(() => {
  if (!currentPlayerId.value) return null;
  return peasantsStore.getPlayerPeasantState(currentPlayerId.value);
});

const currentCount = computed(() => currentAllocation.value?.peasantCount || 0);

const availablePeasants = computed(() => {
  if (!peasantState.value) return 0;
  return peasantState.value.unallocatedPeasants + currentCount.value;
});

const sliderValue = ref(currentCount.value);

const efficiency = computed(() => {
  return calculatePeasantEfficiency(sliderValue.value, props.requiredForOptimal);
});

const efficiencyPercentage = computed(() => efficiency.value * 100);

const productionMultiplier = computed(() => {
  return efficiency.value;
});

const efficiencyColor = computed(() => {
  const eff = efficiencyPercentage.value;
  if (eff >= 100) return 'text-green-400';
  if (eff >= 75) return 'text-yellow-400';
  if (eff >= 50) return 'text-orange-400';
  if (eff > 0) return 'text-red-400';
  return 'text-gray-500';
});

const sliderColor = computed(() => {
  const eff = efficiencyPercentage.value;
  if (eff >= 100) return 'accent-green-500';
  if (eff >= 75) return 'accent-yellow-500';
  if (eff >= 50) return 'accent-orange-500';
  return 'accent-red-500';
});

const presets = computed(() => [
  { label: '0%', value: 0 },
  { label: '50%', value: Math.floor(props.requiredForOptimal * 0.5) },
  { label: '100%', value: props.requiredForOptimal },
  { label: '200%', value: props.requiredForOptimal * 2 },
  { label: '500%', value: props.requiredForOptimal * 5 },
]);

function applyAllocation() {
  if (!currentPlayerId.value) return;

  const result = peasantsStore.allocatePeasants(
    currentPlayerId.value,
    props.targetId,
    props.targetType,
    props.coordinates,
    props.requiredForOptimal,
    sliderValue.value,
  );

  if (result) {
    // Auto-save after allocation (reallocating is FREE - 0 actions)
    import('@/stores/game').then(({ useGameStore }) => {
      console.log('👥 Peasants allocated, triggering auto-save...');
      const gameStore = useGameStore();
      gameStore.saveGame();
    });

    emit('close');
  }
}

function cancel() {
  emit('close');
}

function setPreset(value: number) {
  sliderValue.value = Math.min(value, availablePeasants.value);
}
</script>

<template>
  <!-- Modal Overlay -->
  <div class="fixed inset-0 z-60 flex items-center justify-center p-4">
    <!-- Background overlay -->
    <div class="absolute inset-0 bg-black opacity-70"></div>

    <!-- Dialog content -->
    <div class="relative flex w-full max-w-lg flex-col gap-4 rounded-lg bg-gray-800 p-6 shadow-xl">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-white">Allocate Peasants</h3>
          <p class="mt-1 text-sm text-gray-400">
            {{ label || `${targetType} at (${coordinates.x}, ${coordinates.y})` }}
          </p>
        </div>
        <button
          @click="cancel"
          class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div class="flex flex-col gap-4 border-t border-gray-700 pt-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-lg bg-gray-700/50 p-3">
            <div class="text-xs font-medium uppercase tracking-wide text-gray-400">
              Currently Allocated
            </div>
            <div class="mt-1 text-2xl font-bold text-blue-400">
              {{ currentCount }}
            </div>
          </div>

          <div class="rounded-lg bg-gray-700/50 p-3">
            <div class="text-xs font-medium uppercase tracking-wide text-gray-400">Available</div>
            <div class="mt-1 text-2xl font-bold text-green-400">
              {{ availablePeasants }}
            </div>
          </div>
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="text-sm font-medium text-gray-300"> Peasants to Allocate </label>
            <span class="text-lg font-bold text-white">
              {{ sliderValue }}
            </span>
          </div>

          <input
            v-model.number="sliderValue"
            type="range"
            min="0"
            :max="availablePeasants"
            step="1"
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
            :class="sliderColor"
          />

          <div class="mt-2 flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{{ availablePeasants }}</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in presets"
            :key="preset.label"
            @click="setPreset(preset.value)"
            :disabled="preset.value > availablePeasants"
            class="rounded-lg border border-gray-600 px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              sliderValue === preset.value
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'text-gray-300'
            "
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="rounded-lg border border-gray-700 bg-gray-700/30 p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-300"> Production Efficiency </span>
            <span class="text-xl font-bold" :class="efficiencyColor">
              {{ efficiencyPercentage.toFixed(1) }}%
            </span>
          </div>

          <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-600">
            <div
              class="h-full transition-all duration-300"
              :class="efficiencyColor.replace('text-', 'bg-')"
              :style="{ width: `${Math.min(efficiencyPercentage, 100)}%` }"
            ></div>
          </div>

          <div class="mt-3 text-xs text-gray-400">
            <div class="flex justify-between">
              <span>Required for 100%:</span>
              <span class="font-semibold text-white">{{ requiredForOptimal }} peasants</span>
            </div>
            <div class="mt-1 flex justify-between">
              <span>Production Multiplier:</span>
              <span class="font-semibold" :class="efficiencyColor">
                ×{{ productionMultiplier.toFixed(2) }}
              </span>
            </div>
          </div>

          <div
            v-if="efficiencyPercentage === 0 && sliderValue > 0"
            class="mt-2 rounded bg-red-500/20 p-2 text-xs text-red-400"
          >
            ⚠️ Need at least {{ Math.ceil(requiredForOptimal * 0.5) }} peasants for production
          </div>
          <div
            v-else-if="efficiencyPercentage > 500"
            class="mt-2 rounded bg-yellow-500/20 p-2 text-xs text-yellow-400"
          >
            ⚠️ Efficiency capped at 500%
          </div>
          <div
            v-else-if="efficiencyPercentage < 100 && sliderValue > 0"
            class="mt-2 rounded bg-orange-500/20 p-2 text-xs text-orange-400"
          >
            ⚠️ Suboptimal allocation
          </div>
        </div>

        <!-- Free Reallocation Notice -->
        <div class="rounded-lg bg-green-500/10 p-2 text-xs text-green-400">
          <div class="flex items-center gap-2">
            <span>✓</span>
            <span><strong>Reallocating is FREE</strong> - costs 0 actions</span>
          </div>
        </div>

        <div class="flex gap-3 border-t border-gray-700 pt-4">
          <button
            @click="cancel"
            class="flex-1 rounded-lg bg-gray-700 px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            @click="applyAllocation"
            class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
}
</style>
