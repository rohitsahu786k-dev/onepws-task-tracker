import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Bell, Calendar, CheckCircle2, Clock, MessageSquare, WalletCards } from 'lucide-react';

const icons = {
  sla_breach: AlertTriangle,
  sla_escalation: AlertTriangle,
  task_overdue: Clock,
  task_due_today: Clock,
  task_due_tomorrow: Clock,
  mention: MessageSquare,
  meeting_scheduled: Calendar,
  meeting_reminder: Calendar,
  budget_approved: WalletCards,
  expense_approved: WalletCards,
  mom_signed: CheckCircle2
};

const priorityClass = {
  urgent: 'border-l-red-600 bg-red-50/70 dark:bg-red-950/20',
  high: 'border-l-orange-500 bg-orange-50/60 dark:bg-orange-950/20',
  normal: 'border-l-slate-200',
  low: 'border-l-slate-200 opacity-80'
};

export default function NotificationItem({ notification, onOpen, onArchive }) {
  const Icon = icons[notification.type] || Bell;
  const createdAt = notification.createdAt ? new Date(notification.createdAt) : new Date();

  return (
    <button
      type="button"
      onClick={() => onOpen?.(notification)}
      className={`w-full border-l-4 ${priorityClass[notification.priority] || priorityClass.normal} ${
        notification.isRead ? 'bg-white dark:bg-slate-950' : 'bg-slate-50 dark:bg-slate-900'
      } px-3 py-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800`}
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
              {notification.title}
            </span>
            {!notification.isRead && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
          </span>
          <span className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
            {notification.shortMessage || notification.message}
          </span>
          <span className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
            {onArchive && (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onArchive(notification);
                }}
                className="rounded px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Archive
              </span>
            )}
          </span>
        </span>
      </div>
    </button>
  );
}
