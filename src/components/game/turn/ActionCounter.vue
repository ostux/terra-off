<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTurnStore } from '@/stores/game/turn';

const { t } = useI18n();
const turnStore = useTurnStore();

const actionsRemaining = computed(() => turnStore.actionsRemaining);
const maxActions = computed(() => {
  const actionState = turnStore.currentPlayerActionState;
  return actionState?.maxActionsPerTurn ?? 0;
});

const percentage = computed(() => {
  if (maxActions.value === 0) return 0;
  return (actionsRemaining.value / maxActions.value) * 100;
});

const colorClass = computed(() => {
  if (actionsRemaining.value === 0) return 'text-red-400';
  if (actionsRemaining.value <= 2) return 'text-yellow-400';
  return 'text-green-400';
});

const progressColorClass = computed(() => {
  if (actionsRemaining.value === 0) return 'bg-red-500';
  if (actionsRemaining.value <= 2) return 'bg-yellow-500';
  return 'bg-green-500';
});
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex flex-col items-end">
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold" :class="colorClass">
          {{ actionsRemaining }}
        </span>
        <span class="text-sm text-gray-400">/</span>
        <span class="text-lg font-semibold text-gray-300">
          {{ maxActions }}
        </span>
      </div>
      <span class="text-xs text-gray-400">
        {{ t('turn.actionsRemaining', actionsRemaining) }}
      </span>
    </div>

    <div class="h-12 w-2 overflow-hidden rounded-full bg-gray-700">
      <div
        class="w-full transition-all duration-300"
        :class="progressColorClass"
        :style="{ height: `${percentage}%`, marginTop: `${100 - percentage}%` }"
      ></div>
    </div>
  </div>
</template>
