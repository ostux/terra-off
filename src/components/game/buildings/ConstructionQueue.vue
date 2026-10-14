<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBuildingsStore } from '@/stores/game/buildings';
import { useTurnStore } from '@/stores/game/turn';
import { useResourcesStore } from '@/stores/game/resources';
import { useNotification } from '@/composables/useNotification';
import { getBuildingById } from '@/data/buildings';
import type { BuildingInConstruction } from '@/stores/game/buildings';

const { t } = useI18n();
const buildingsStore = useBuildingsStore();
const turnStore = useTurnStore();
const resourcesStore = useResourcesStore();
const { confirm } = useNotification();

const currentPlayerId = computed(() => turnStore.currentPlayerId);

const queue = computed(() => {
  if (!currentPlayerId.value) return [];
  return buildingsStore.getPlayerConstructionQueue(currentPlayerId.value);
});

function cancelConstruction(construction: BuildingInConstruction) {
  if (!currentPlayerId.value) return;

  const buildingName = t(getBuildingById(construction.buildingId)!.nameKey);

  confirm(
    t('turn.confirm.cancelConstruction'),
    () => {
      const refund = buildingsStore.cancelConstruction(construction.entityId);

      if (refund && currentPlayerId.value) {
        resourcesStore.addResources(
          currentPlayerId.value,
          refund,
          `Construction cancelled: ${buildingName}`,
          turnStore.turnNumber,
        );
      }
    },
    undefined,
    {
      confirmLabel: t('building.queue.cancel'),
      cancelLabel: t('common.cancel'),
    },
  );
}

function getProgressPercentage(construction: BuildingInConstruction): number {
  const elapsed = construction.totalTurns - construction.turnsRemaining;
  return (elapsed / construction.totalTurns) * 100;
}
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg bg-gray-800 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-300">
        {{ t('building.queue.title') }}
      </h3>
      <span class="text-xs text-gray-500">
        {{ t('building.queue.count', queue.length) }}
      </span>
    </div>

    <div v-if="queue.length === 0" class="rounded-lg bg-gray-700/50 p-4 text-center text-sm text-gray-400">
      {{ t('building.queue.empty') }}
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="construction in queue"
        :key="construction.entityId"
        class="group rounded-lg border border-gray-600 bg-gray-700/50 p-3 transition-colors hover:border-gray-500"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-lg">🏗️</span>
              <div>
                <h4 class="font-semibold text-white">
                  {{ t(getBuildingById(construction.buildingId)!.nameKey) }}
                </h4>
                <p class="text-xs text-gray-400">
                  ({{ construction.coordinates.x }}, {{ construction.coordinates.y }})
                </p>
              </div>
            </div>

            <div class="mt-2">
              <div class="mb-1 flex items-center justify-between text-xs">
                <span class="text-gray-400">{{ t('building.queue.progress') }}</span>
                <span class="font-semibold text-blue-400">
                  {{ construction.totalTurns - construction.turnsRemaining }} /
                  {{ construction.totalTurns }} {{ t('turn.actionsRemaining', construction.totalTurns).split(' ')[1] }}
                </span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-gray-600">
                <div
                  class="h-full bg-blue-500 transition-all duration-500"
                  :style="{ width: `${getProgressPercentage(construction)}%` }"
                ></div>
              </div>
            </div>

            <div class="mt-2 flex items-center gap-2 text-xs">
              <span
                v-if="construction.turnsRemaining === 1"
                class="rounded bg-green-500/20 px-2 py-1 font-semibold text-green-400"
              >
                ✓ {{ t('building.queue.completesNextTurn') }}
              </span>
              <span
                v-else
                class="rounded bg-blue-500/20 px-2 py-1 font-semibold text-blue-400"
              >
                {{ t('building.queue.turnsRemaining', construction.turnsRemaining) }}
              </span>
            </div>
          </div>

          <button
            @click="cancelConstruction(construction)"
            class="ml-2 rounded-lg bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
            :title="t('building.queue.cancelTitle')"
          >
            {{ t('building.queue.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
