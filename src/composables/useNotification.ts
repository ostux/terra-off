/**
 * Notification Composable
 * Convenient wrapper around the notifications store
 */

import { useNotificationsStore, NotificationType } from '@/stores/ui/notifications';

export function useNotification() {
  const store = useNotificationsStore();

  return {
    // Direct methods
    info: store.info,
    success: store.success,
    warning: store.warning,
    error: store.error,
    confirm: store.confirm,

    // Advanced
    notify: store.addNotification,
    remove: store.removeNotification,
    clearAll: store.clearAll,

    // Types export for convenience
    NotificationType,
  };
}
