<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useTurnStore } from '@/stores/game/turn';
import { TurnPhase } from '@/data/types';

interface Props {
  /** Time limit per turn in seconds (0 = disabled) */
  timeLimit?: number;
  /** Show warning when time is running low */
  warningThreshold?: number;
}

const props = withDefaults(defineProps<Props>(), {
  timeLimit: 0,
  warningThreshold: 30,
});

const turnStore = useTurnStore();

const timeRemaining = ref(0);
const interval = ref<number | null>(null);

const isEnabled = computed(() => props.timeLimit > 0);
const isResolutionPhase = computed(() => turnStore.phase === TurnPhase.RESOLUTION);
const isWarning = computed(() => timeRemaining.value <= props.warningThreshold && timeRemaining.value > 0);
const isExpired = computed(() => timeRemaining.value === 0 && isEnabled.value);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const colorClass = computed(() => {
  if (isExpired.value) return 'text-red-500';
  if (isWarning.value) return 'text-yellow-500';
  return 'text-gray-300';
});

const progressColorClass = computed(() => {
  if (isExpired.value) return 'bg-red-500';
  if (isWarning.value) return 'bg-yellow-500';
  return 'bg-blue-500';
});

const progressPercentage = computed(() => {
  if (!isEnabled.value || props.timeLimit === 0) return 100;
  return (timeRemaining.value / props.timeLimit) * 100;
});

function startTimer() {
  if (!isEnabled.value || isResolutionPhase.value) return;

  stopTimer();
  timeRemaining.value = props.timeLimit;

  interval.value = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    } else {
      stopTimer();
      // Auto end turn when time expires
      if (!isResolutionPhase.value) {
        turnStore.endTurn();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (interval.value !== null) {
    clearInterval(interval.value);
    interval.value = null;
  }
}

// Watch for turn changes to restart timer
watch(
  () => [turnStore.turnNumber, turnStore.currentPlayerId],
  () => {
    if (isEnabled.value && !isResolutionPhase.value) {
      startTimer();
    }
  },
  { immediate: true },
);

// Watch for phase changes
watch(
  () => turnStore.phase,
  (newPhase) => {
    if (newPhase === TurnPhase.RESOLUTION) {
      stopTimer();
    } else if (newPhase === TurnPhase.ACTION && isEnabled.value) {
      startTimer();
    }
  },
);

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <div v-if="isEnabled" class="flex flex-col items-center gap-1">
    <div class="flex items-center gap-2">
      <svg
        v-if="!isExpired"
        class="h-4 w-4"
        :class="colorClass"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <svg
        v-else
        class="h-4 w-4 animate-pulse"
        :class="colorClass"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          fill-rule="evenodd"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
          clip-rule="evenodd"
        />
      </svg>

      <span class="font-mono text-lg font-semibold" :class="colorClass">
        {{ formatTime(timeRemaining) }}
      </span>
    </div>

    <div class="h-1 w-24 overflow-hidden rounded-full bg-gray-700">
      <div
        class="h-full transition-all duration-1000 ease-linear"
        :class="progressColorClass"
        :style="{ width: `${progressPercentage}%` }"
      ></div>
    </div>
  </div>
</template>
