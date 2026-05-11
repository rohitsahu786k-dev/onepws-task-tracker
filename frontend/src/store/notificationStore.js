import { create } from 'zustand';
import * as notificationService from '../services/notification.service';

const normalizeId = (notification) => ({
  ...notification,
  id: notification.id || notification._id
});

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await notificationService.getNotifications(params);
      const notifications = (res.data || []).map(normalizeId);
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchUnreadCount: async () => {
    const res = await notificationService.getUnreadCount();
    set({ unreadCount: res.count || 0 });
  },

  setNotifications: (notifications) =>
    set({
      notifications: notifications.map(normalizeId),
      unreadCount: notifications.filter((n) => !n.isRead).length
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [normalizeId({ ...notification, isRead: false }), ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1
    })),

  markAsRead: async (id) => {
    const item = get().notifications.find((n) => n.id === id || n._id === id);
    if (!item || item.isRead) return;
    get().markAsReadLocal(id);
    await notificationService.markNotificationRead(id);
  },

  markAsReadLocal: (id) =>
    set((state) => {
      const item = state.notifications.find((n) => n.id === id || n._id === id);
      return {
        notifications: state.notifications.map((n) =>
          n.id === id || n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: item?.isRead ? state.unreadCount : Math.max(0, state.unreadCount - 1)
      };
    }),

  markAllRead: async () => {
    get().markAllReadLocal();
    await notificationService.markAllNotificationsRead();
  },

  markAllReadLocal: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0
    })),

  archiveLocal: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id && n._id !== id)
    }))
}));
