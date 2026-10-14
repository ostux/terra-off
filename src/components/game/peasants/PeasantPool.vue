<script setup lang="ts">
import { computed } from 'vue';
import { usePeasantsStore } from '@/stores/game/peasants';
import { useTurnStore } from '@/stores/game/turn';

const peasantsStore = usePeasantsStore();
const turnStore = useTurnStore();

const currentPlayerId = computed(() => turnStore.currentPlayerId);

const peasantState = computed(() => {
  if (!currentPlayerId.value) return null;
  return peasantsStore.getPlayerPeasantState(currentPlayerId.value);
});

const peasantStats = computed(() => {
  if (!currentPlayerId.value) return null;
  return peasantsStore.getPeasantStats(currentPlayerId.value);
});

const utilizationPercentage = computed(() => {
  return peasantStats.value?.utilizationRate || 0;
});

const averageEfficiencyPercentage = computed(() => {
  return (peasantStats.value?.averageEfficiency || 0) * 100;
});

const utilizationColor = computed(() => {
  const rate = utilizationPercentage.value;
  if (rate >= 90) return 'text-green-400';
  if (rate >= 70) return 'text-yellow-400';
  return 'text-red-400';
});

const efficiencyColor = computed(() => {
  const eff = averageEfficiencyPercentage.value;
  if (eff >= 100) return 'text-green-400';
  if (eff >= 75) return 'text-yellow-400';
  if (eff >= 50) return 'text-orange-400';
  return 'text-red-400';
});
</script>

<template>
  <div v-if="peasantState && peasantStats" class="flex flex-col gap-3 rounded-lg bg-gray-800 p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-2xl">👥</span>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Peasants
        </h3>
      </div>
      <div class="text-right">
        <div class="text-lg font-bold text-white">
          {{ peasantState.totalPeasants }}
        </div>
        <div class="text-xs text-gray-400">
          Total
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-lg bg-gray-700/50 p-3">
        <div class="text-xs font-medium uppercase tracking-wide text-gray-400">
          Allocated
        </div>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-xl font-bold text-blue-400">
            {{ peasantState.allocatedPeasants }}
          </span>
          <span class="text-sm text-gray-400">
            / {{ peasantState.totalPeasants }}
          </span>
        </div>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-600">
          <div
            class="h-full bg-blue-500 transition-all duration-300"
            :style="{ width: `${utilizationPercentage}%` }"
          ></div>
        </div>
      </div>

      <div class="rounded-lg bg-gray-700/50 p-3">
        <div class="text-xs font-medium uppercase tracking-wide text-gray-400">
          Unallocated
        </div>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-xl font-bold" :class="peasantState.unallocatedPeasants > 0 ? 'text-green-400' : 'text-gray-500'">
            {{ peasantState.unallocatedPeasants }}
          </span>
        </div>
        <div v-if="peasantState.unallocatedPeasants > 0" class="mt-2 text-xs text-yellow-400">
          ⚠️ Idle peasants
        </div>
        <div v-else class="mt-2 text-xs text-green-400">
          ✓ All assigned
        </div>
      </div>
    </div>

    <div class="border-t border-gray-700 pt-3">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-400">Utilization Rate</span>
        <span class="font-semibold" :class="utilizationColor">
          {{ utilizationPercentage.toFixed(1) }}%
        </span>
      </div>

      <div class="mt-2 flex items-center justify-between text-sm">
        <span class="text-gray-400">Average Efficiency</span>
        <span class="font-semibold" :class="efficiencyColor">
          {{ averageEfficiencyPercentage.toFixed(1) }}%
        </span>
      </div>

      <div v-if="peasantStats.suboptimalAllocations > 0" class="mt-2 flex items-center justify-between text-sm">
        <span class="text-gray-400">Suboptimal Allocations</span>
        <span class="font-semibold text-orange-400">
          {{ peasantStats.suboptimalAllocations }}
        </span>
      </div>
    </div>

    <div v-if="peasantState.peasantSources.length > 0" class="border-t border-gray-700 pt-3">
      <div class="text-xs font-medium uppercase tracking-wide text-gray-400">
        Peasant Sources
      </div>
      <div class="mt-2 flex flex-col gap-1">
        <div
          v-for="source in peasantState.peasantSources"
          :key="source.buildingEntityId"
          class="flex items-center justify-between rounded bg-gray-700/30 px-2 py-1 text-xs"
        >
          <span class="text-gray-300">{{ source.buildingId }}</span>
          <span class="font-semibold text-green-400">+{{ source.peasantsGenerated }}</span>
        </div>
      </div>
    </div>

    <!-- Info Panel -->
    <div class="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
      <div class="mb-2 flex items-center gap-2">
        <span class="text-blue-400">💡</span>
        <span class="text-xs font-semibold uppercase tracking-wide text-blue-400">How It Works</span>
      </div>
      <div class="space-y-1 text-xs text-blue-200">
        <div class="flex items-start gap-2">
          <span class="text-blue-400">•</span>
          <span><strong>Build houses</strong> (tent/hut/house) to generate peasants</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-blue-400">•</span>
          <span><strong>Allocate to buildings</strong> for resource production</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-blue-400">•</span>
          <span><strong>6 peasants = 100% efficiency</strong> (optimal for most buildings)</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-blue-400">•</span>
          <span><strong>30 peasants = 500% efficiency</strong> (maximum production)</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-green-400">✓</span>
          <span><strong>Reallocating is FREE</strong> (costs 0 actions)</span>
        </div>
      </div>
    </div>
  </div>
</template>
