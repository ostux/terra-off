/**
 * Notifications Store
 * Manages toast notifications and confirmation dialogs
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface NotificationAction {
  label: string;
  handler: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  actions?: NotificationAction[];
  duration?: number; // milliseconds, 0 = manual dismiss only
  dismissible?: boolean;
  createdAt?: number; // timestamp for progress calculation
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const timers = new Map<string, number>(); // Track timer IDs for cleanup
  let nextId = 1;

  /**
   * Add a notification
   */
  function addNotification(notification: Omit<Notification, 'id'>): string {
    const id = `notification-${nextId++}`;
    const newNotification: Notification = {
      id,
      dismissible: notification.dismissible ?? true,
      duration: notification.duration ?? 5000, // Default 5 seconds
      createdAt: Date.now(),
      ...notification,
    };

    notifications.value.push(newNotification);

    // Auto-dismiss after duration (if not 0)
    if (newNotification.duration && newNotification.duration > 0) {
      console.log(`⏱️ Notification "${id}" will auto-dismiss in ${newNotification.duration}ms`);

      const timerId = window.setTimeout(() => {
        console.log(`⏰ Auto-dismissing notification "${id}"`);
        removeNotification(id);
      }, newNotification.duration);

      timers.set(id, timerId);
    }

    return id;
  }

  /**
   * Remove a notification
   */
  function removeNotification(id: string): void {
    // Clear timer if exists
    const timerId = timers.get(id);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timers.delete(id);
    }

    // Remove notification
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  /**
   * Clear all notifications
   */
  function clearAll(): void {
    // Clear all timers
    timers.forEach((timerId) => clearTimeout(timerId));
    timers.clear();

    // Clear all notifications
    notifications.value = [];
  }

  /**
   * Show info notification
   */
  function info(message: string, duration?: number): string {
    return addNotification({
      type: NotificationType.INFO,
      message,
      duration,
    });
  }

  /**
   * Show success notification
   */
  function success(message: string, duration?: number): string {
    return addNotification({
      type: NotificationType.SUCCESS,
      message,
      duration,
    });
  }

  /**
   * Show warning notification
   */
  function warning(message: string, duration?: number): string {
    return addNotification({
      type: NotificationType.WARNING,
      message,
      duration,
    });
  }

  /**
   * Show error notification
   */
  function error(message: string, duration?: number): string {
    return addNotification({
      type: NotificationType.ERROR,
      message,
      duration: duration ?? 8000, // Errors stay longer by default
    });
  }

  /**
   * Show confirmation dialog
   */
  function confirm(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      confirmLabel?: string;
      cancelLabel?: string;
      type?: NotificationType;
    },
  ): string {
    return addNotification({
      type: options?.type ?? NotificationType.WARNING,
      message,
      duration: 0, // Manual dismiss only
      dismissible: false,
      actions: [
        {
          label: options?.cancelLabel ?? 'Cancel',
          variant: 'secondary',
          handler: () => {
            if (onCancel) onCancel();
          },
        },
        {
          label: options?.confirmLabel ?? 'Confirm',
          variant: options?.type === NotificationType.ERROR ? 'danger' : 'primary',
          handler: onConfirm,
        },
      ],
    });
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    info,
    success,
    warning,
    error,
    confirm,
  };
});
