import { X } from 'lucide-react';
import NotificationList from './NotificationList';

export default function NotificationDrawer({ open, onClose, notifications, onOpen, onArchive }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close drawer overlay" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-50 shadow-xl dark:bg-slate-900">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <h2 className="text-base font-semibold">Notifications</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
          <NotificationList notifications={notifications} onOpen={onOpen} onArchive={onArchive} />
        </div>
      </aside>
    </div>
  );
}
