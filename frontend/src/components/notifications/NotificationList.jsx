import NotificationItem from './NotificationItem';

export default function NotificationList({ notifications, emptyText = 'No notifications yet.', onOpen, onArchive }) {
  if (!notifications?.length) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id || notification._id}
          notification={notification}
          onOpen={onOpen}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
