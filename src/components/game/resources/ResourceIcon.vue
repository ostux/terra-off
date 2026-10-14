<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ResourceType } from '@/data/types';
import { getResourceById } from '@/data/resources';

interface Props {
  resourceType: ResourceType;
  amount?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false,
  size: 'md',
});

const { t } = useI18n();
const resource = computed(() => getResourceById(props.resourceType));

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-base gap-1';
    case 'lg':
      return 'text-2xl gap-2';
    default:
      return 'text-lg gap-1.5';
  }
});

const formatAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
};
</script>

<template>
  <div
    class="flex items-center"
    :class="[sizeClasses, resource.color]"
    :title="t(resource.descriptionKey)"
  >
    <span>{{ resource.iconName }}</span>
    <span v-if="amount !== undefined" class="font-semibold text-white">
      {{ formatAmount(amount) }}
    </span>
    <span v-if="showLabel" class="text-sm text-gray-300">
      {{ t(resource.nameKey) }}
    </span>
  </div>
</template>
