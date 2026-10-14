<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useNotificationsStore, NotificationType } from '@/stores/ui/notifications';
import type { Notification } from '@/stores/ui/notifications';

const notificationsStore = useNotificationsStore();

// Track progress for each notification
const progressMap = ref<Map<string, number>>(new Map());
let animationFrameId: number | null = null;

function getNotificationClasses(type: NotificationType): string {
  const baseClasses = 'rounded-lg p-4 shadow-lg border overflow-hidden';

  switch (type) {
    case NotificationType.INFO:
      return `${baseClasses} bg-blue-50 border-blue-200 text-blue-900`;
    case NotificationType.SUCCESS:
      return `${baseClasses} bg-green-50 border-green-200 text-green-900`;
    case NotificationType.WARNING:
      return `${baseClasses} bg-orange-50 border-orange-200 text-orange-900`;
    case NotificationType.ERROR:
      return `${baseClasses} bg-red-50 border-red-200 text-red-900`;
    default:
      return `${baseClasses} bg-gray-50 border-gray-200 text-gray-900`;
  }
}

function getProgressBarColor(type: NotificationType): string {
  switch (type) {
    case NotificationType.INFO:
      return 'bg-blue-400';
    case NotificationType.SUCCESS:
      return 'bg-green-400';
    case NotificationType.WARNING:
      return 'bg-orange-400';
    case NotificationType.ERROR:
      return 'bg-red-400';
    default:
      return 'bg-gray-400';
  }
}

function getIconForType(type: NotificationType): string {
  switch (type) {
    case NotificationType.INFO:
      return 'ℹ️';
    case NotificationType.SUCCESS:
      return '✅';
    case NotificationType.WARNING:
      return '⚠️';
    case NotificationType.ERROR:
      return '❌';
    default:
      return 'ℹ️';
  }
}

function getButtonClasses(variant?: 'primary' | 'secondary' | 'danger'): string {
  const baseClasses = 'px-3 py-1.5 rounded text-sm font-medium transition-colors';

  switch (variant) {
    case 'primary':
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    case 'danger':
      return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
    case 'secondary':
    default:
      return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`;
  }
}

function handleActionClick(notification: Notification, handler: () => void) {
  handler();
  notificationsStore.removeNotification(notification.id);
}

function handleDismiss(notification: Notification) {
  if (notification.dismissible) {
    notificationsStore.removeNotification(notification.id);
  }
}

// Update progress bars
function updateProgress() {
  const now = Date.now();

  notificationsStore.notifications.forEach((notification) => {
    if (notification.duration && notification.duration > 0 && notification.createdAt) {
      const elapsed = now - notification.createdAt;
      const progress = Math.min(100, (elapsed / notification.duration) * 100);
      progressMap.value.set(notification.id, progress);
    }
  });

  animationFrameId = requestAnimationFrame(updateProgress);
}

onMounted(() => {
  updateProgress();
});

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<template>
  <!-- Notification Container - Fixed to bottom right -->
  <div class="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-3 p-4 sm:p-6">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notificationsStore.notifications"
        :key="notification.id"
        :class="getNotificationClasses(notification.type)"
        class="pointer-events-auto relative min-w-80 max-w-96"
      >
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div class="shrink-0 text-2xl">
            {{ getIconForType(notification.type) }}
          </div>

          <!-- Content -->
          <div class="flex-1 space-y-2">
            <!-- Message -->
            <p class="text-sm font-medium leading-relaxed whitespace-pre-line">
              {{ notification.message }}
            </p>

            <!-- Actions -->
            <div v-if="notification.actions && notification.actions.length > 0" class="flex gap-2">
              <button
                v-for="(action, index) in notification.actions"
                :key="index"
                :class="getButtonClasses(action.variant)"
                @click="handleActionClick(notification, action.handler)"
              >
                {{ action.label }}
              </button>
            </div>
          </div>

          <!-- Dismiss button -->
          <button
            v-if="notification.dismissible"
            class="shrink-0 text-gray-400 hover:text-gray-600"
            @click="handleDismiss(notification)"
          >
            ✕
          </button>
        </div>

        <!-- Progress bar (only for auto-dismiss notifications) -->
        <div
          v-if="notification.duration && notification.duration > 0"
          class="absolute bottom-0 left-0 right-0 h-1 bg-black/5"
        >
          <div
            :class="getProgressBarColor(notification.type)"
            class="h-full transition-all duration-100 ease-linear"
            :style="{ width: `${100 - (progressMap.get(notification.id) || 0)}%` }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Notification slide-in animation */
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.2s ease-in;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
