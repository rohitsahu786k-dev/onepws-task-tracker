import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { useNotificationStore } from '../../store/notificationStore';
import * as notificationService from '../../services/notification.service';

export default function NotificationBell() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const archiveLocal = useNotificationStore((state) => state.archiveLocal);

  useEffect(() => {
    fetchNotifications({ limit: 10 }).catch(() => {});
    fetchUnreadCount().catch(() => {});
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleOpen = async (notification) => {
    await markAsRead(notification.id || notification._id).catch(() => {});
    setOpen(false);
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  const handleArchive = async (notification) => {
    const id = notification.id || notification._id;
    archiveLocal(id);
    await notificationService.archiveNotification(id).catch(() => {});
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationDropdown
          notifications={notifications}
          onOpen={handleOpen}
          onArchive={handleArchive}
          onMarkAllRead={() => markAllRead().catch(() => {})}
        />
      )}
    </div>
  );
}
