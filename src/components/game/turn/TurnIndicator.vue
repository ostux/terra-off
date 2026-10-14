<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTurnStore } from '@/stores/game/turn';
import { TurnPhase } from '@/data/types';

const { t } = useI18n();
const turnStore = useTurnStore();

const isResolutionPhase = computed(() => turnStore.phase === TurnPhase.RESOLUTION);
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="rounded-lg bg-gray-700 px-3 py-1.5">
      <span class="font-semibold text-white">
        {{ t('turn.number', { turn: turnStore.turnNumber }) }}
      </span>
    </div>

    <div
      v-if="isResolutionPhase"
      class="flex items-center gap-2 rounded-lg bg-blue-600/20 px-3 py-1.5 text-blue-400"
    >
      <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400"></span>
      <span class="text-sm font-medium">Resolving...</span>
    </div>
  </div>
</template>
