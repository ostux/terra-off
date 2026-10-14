<script setup lang="ts">
import { computed } from 'vue';
import { useResourcesStore } from '@/stores/game/resources';
import { useTurnStore } from '@/stores/game/turn';
import { ResourceType } from '@/data/types';
import ResourceIcon from './ResourceIcon.vue';

const resourceStore = useResourcesStore();
const turnStore = useTurnStore();

const currentPlayerId = computed(() => turnStore.currentPlayerId);

const playerResources = computed(() => {
  if (!currentPlayerId.value) return null;
  return resourceStore.getPlayerResources(currentPlayerId.value);
});

const resources = computed(() => {
  if (!playerResources.value) return [];

  return [
    {
      type: ResourceType.FOOD,
      amount: playerResources.value.current[ResourceType.FOOD],
      production: playerResources.value.netProduction[ResourceType.FOOD],
    },
    {
      type: ResourceType.WOOD,
      amount: playerResources.value.current[ResourceType.WOOD],
      production: playerResources.value.netProduction[ResourceType.WOOD],
    },
    {
      type: ResourceType.STONE,
      amount: playerResources.value.current[ResourceType.STONE],
      production: playerResources.value.netProduction[ResourceType.STONE],
    },
    {
      type: ResourceType.IRON,
      amount: playerResources.value.current[ResourceType.IRON],
      production: playerResources.value.netProduction[ResourceType.IRON],
    },
  ];
});

const formatProduction = (production: number): string => {
  const sign = production >= 0 ? '+' : '';
  return `${sign}${production}`;
};
</script>

<template>
  <div class="flex items-center gap-6">
    <div
      v-for="resource in resources"
      :key="resource.type"
      class="flex items-center gap-2"
    >
      <ResourceIcon
        :resource-type="resource.type"
        :amount="resource.amount"
        size="md"
      />
      <span
        class="text-sm"
        :class="resource.production >= 0 ? 'text-green-400' : 'text-red-400'"
      >
        ({{ formatProduction(resource.production) }}/turn)
      </span>
    </div>
  </div>
</template>
