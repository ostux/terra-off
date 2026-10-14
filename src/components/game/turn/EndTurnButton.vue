<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTurnStore } from '@/stores/game/turn';
import { useNotification } from '@/composables/useNotification';
import { TurnPhase } from '@/data/types';

const { t } = useI18n();
const turnStore = useTurnStore();
const { confirm } = useNotification();

const isResolutionPhase = computed(() => turnStore.phase === TurnPhase.RESOLUTION);
const actionsRemaining = computed(() => turnStore.actionsRemaining);
const hasUnusedActions = computed(() => actionsRemaining.value > 0);

const buttonClass = computed(() => {
  if (isResolutionPhase.value) {
    return 'bg-gray-600 cursor-not-allowed';
  }
  if (hasUnusedActions.value) {
    return 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800';
  }
  return 'bg-green-600 hover:bg-green-700 active:bg-green-800';
});

function handleEndTurn() {
  if (isResolutionPhase.value) return;

  if (hasUnusedActions.value) {
    confirm(
      t('turn.confirm.endTurnWithActions', actionsRemaining.value),
      () => {
        turnStore.endTurn();
      },
      undefined,
      {
        confirmLabel: t('turn.endTurn'),
        cancelLabel: t('common.cancel'),
      },
    );
    return;
  }

  turnStore.endTurn();
}
</script>

<template>
  <button
    @click="handleEndTurn"
    :disabled="isResolutionPhase"
    class="min-w-32 rounded-lg px-6 py-2.5 font-semibold text-white transition-colors"
    :class="buttonClass"
  >
    {{ t('turn.endTurn') }}
  </button>
</template>
