import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationList from '../../components/notifications/NotificationList';
import { useNotificationStore } from '../../store/notificationStore';
import * as notificationService from '../../services/notification.service';

const filters = [
  ['all', 'All'],
  ['unread', 'Unread'],
  ['task', 'Task'],
  ['sla', 'SLA'],
  ['mom', 'MOM'],
  ['meeting', 'Meeting'],
  ['budget', 'Budget'],
  ['system', 'System']
];

export default function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const notifications = useNotificationStore((state) => state.notifications);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const archiveLocal = useNotificationStore((state) => state.archiveLocal);

  const visible = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => n.type?.includes(filter));
  }, [filter, notifications]);

  const openNotification = async (notification) => {
    await markAsRead(notification.id || notification._id).catch(() => {});
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  const archiveNotification = async (notification) => {
    const id = notification.id || notification._id;
    archiveLocal(id);
    await notificationService.archiveNotification(id).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Notifications</h1>
          <p className="text-sm text-slate-500">Role based activity, alerts, reminders, and escalations.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => fetchNotifications({ limit: 50 })} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-700">
            Refresh
          </button>
          <button type="button" onClick={() => markAllRead().catch(() => {})} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white">
            Mark all read
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === key
                ? 'bg-primary text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <NotificationList notifications={visible} onOpen={openNotification} onArchive={archiveNotification} />
    </div>
  );
}
