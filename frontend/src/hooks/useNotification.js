import { useCallback, useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';

export function useNotification() {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  const refresh = useCallback(() => {
    return Promise.all([fetchNotifications({ limit: 20 }), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return { notifications, unreadCount, isLoading, markAsRead, markAllRead, refresh };
}
