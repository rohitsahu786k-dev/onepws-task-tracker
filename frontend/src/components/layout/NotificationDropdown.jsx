import { Link } from 'react-router-dom';
import NotificationList from '../notifications/NotificationList';

export default function NotificationDropdown({ notifications, onOpen, onArchive, onMarkAllRead }) {
  return (
    <div className="absolute right-0 top-11 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Notifications</div>
          <div className="text-xs text-slate-500">Latest activity</div>
        </div>
        <button type="button" onClick={onMarkAllRead} className="text-xs font-medium text-primary hover:underline">
          Mark all read
        </button>
      </div>
      <div className="max-h-[28rem] overflow-y-auto">
        <NotificationList notifications={notifications.slice(0, 10)} onOpen={onOpen} onArchive={onArchive} />
      </div>
      <Link
        to="/notifications"
        className="block border-t border-slate-200 px-4 py-3 text-center text-sm font-medium text-primary hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
      >
        View all notifications
      </Link>
    </div>
  );
}
