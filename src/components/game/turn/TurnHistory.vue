<script setup lang="ts">
import { computed } from 'vue';
import { useTurnStore } from '@/stores/game/turn';
import { ActionType, type PlayerAction, type BuildAction, type TrainAction, type ResearchAction, type AllocatePeasantsAction } from '@/data/types';
import { getActionCost } from '@/data/config';

interface Props {
  /** Maximum number of actions to display */
  maxActions?: number;
  /** Show action costs */
  showCosts?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxActions: 10,
  showCosts: true,
});

const turnStore = useTurnStore();

const currentPlayerActions = computed(() => {
  const actionState = turnStore.currentPlayerActionState;
  if (!actionState) return [];

  return actionState.actionsTaken.slice(-props.maxActions).reverse();
});

const getActionIcon = (actionType: ActionType): string => {
  switch (actionType) {
    case ActionType.BUILD:
      return '🏗️';
    case ActionType.DEMOLISH:
      return '💥';
    case ActionType.TRAIN:
      return '⚔️';
    case ActionType.MOVE:
      return '➡️';
    case ActionType.ATTACK:
      return '⚡';
    case ActionType.RESEARCH:
      return '🔬';
    case ActionType.UPGRADE:
      return '⬆️';
    case ActionType.ALLOCATE_PEASANTS:
      return '👥';
    default:
      return '❓';
  }
};

const getActionLabel = (action: PlayerAction): string => {
  switch (action.actionType) {
    case ActionType.BUILD:
      return `Build ${(action as BuildAction).buildingId}`;
    case ActionType.DEMOLISH:
      return 'Demolish building';
    case ActionType.TRAIN: {
      const trainAction = action as TrainAction;
      return `Train ${trainAction.quantity}x ${trainAction.unitId}`;
    }
    case ActionType.MOVE:
      return 'Move unit';
    case ActionType.ATTACK:
      return 'Attack';
    case ActionType.RESEARCH:
      return `Research ${(action as ResearchAction).researchId}`;
    case ActionType.UPGRADE:
      return 'Upgrade building';
    case ActionType.ALLOCATE_PEASANTS:
      return `Allocate ${(action as AllocatePeasantsAction).peasantCount} peasants`;
    default:
      return 'Unknown action';
  }
};

const getActionCostValue = (actionType: ActionType): number => {
  return getActionCost(actionType);
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg bg-gray-800 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Turn Actions
      </h3>
      <span class="text-xs text-gray-500">
        {{ currentPlayerActions.length }} action{{ currentPlayerActions.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <div v-if="currentPlayerActions.length === 0" class="py-4 text-center text-sm text-gray-500">
      No actions taken this turn
    </div>

    <div v-else class="flex max-h-64 flex-col gap-1 overflow-y-auto">
      <div
        v-for="(action, index) in currentPlayerActions"
        :key="index"
        class="flex items-center justify-between rounded bg-gray-700/50 px-3 py-2 text-sm transition-colors hover:bg-gray-700"
      >
        <div class="flex items-center gap-2">
          <span class="text-base">{{ getActionIcon(action.actionType) }}</span>
          <span class="text-gray-200">{{ getActionLabel(action) }}</span>
        </div>

        <div class="flex items-center gap-2">
          <span v-if="showCosts" class="text-xs font-medium text-gray-400">
            {{ getActionCostValue(action.actionType) }}
            <span v-if="getActionCostValue(action.actionType) === 0" class="text-green-400">FREE</span>
            <span v-else class="text-yellow-400">AP</span>
          </span>
          <span class="text-xs text-gray-500">
            {{ formatTime(action.timestamp) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
