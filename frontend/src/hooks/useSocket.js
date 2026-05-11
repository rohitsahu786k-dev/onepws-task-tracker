import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const TOAST_EVENTS = new Set([
  'task_assigned',
  'mention',
  'meeting_scheduled',
  'meeting_reminder',
  'task_overdue',
  'sla_breach',
  'mom_pending_signature',
  'budget_approved',
  'expense_approved'
]);

function showNotificationToast(notification) {
  if (!TOAST_EVENTS.has(notification.type)) return;

  const isUrgent = notification.priority === 'urgent';
  toast(`${notification.title}\n${notification.message}`, {
    duration: isUrgent ? 9000 : 5000,
    className: isUrgent ? 'border border-red-300' : ''
  });
}

export function useSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!isAuthenticated || !accessToken) return undefined;

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const socket = io(baseUrl, {
      auth: { token: accessToken },
      withCredentials: true
    });

    socket.on('notification:new', (notification) => {
      addNotification(notification);
      showNotificationToast(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, addNotification]);
}
