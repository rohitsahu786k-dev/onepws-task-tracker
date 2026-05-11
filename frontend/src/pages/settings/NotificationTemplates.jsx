import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import NotificationTemplateEditor from '../../components/notifications/NotificationTemplateEditor';
import useAuthStore from '../../store/authStore';
import * as notificationService from '../../services/notification.service';

const emptyTemplate = {
  name: '',
  event: 'task_assigned',
  channel: 'slack',
  titleTemplate: 'Task Assigned: {{taskNumber}}',
  bodyTemplate: '{{assignedToName}}, a task "{{taskTitle}}" has been assigned to you.\nOpen: {{actionUrl}}',
  isActive: true
};

export default function NotificationTemplates() {
  const workspaceId = useAuthStore((state) => state.workspace?._id || state.user?.defaultWorkspace);
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = () => {
    if (!workspaceId) return;
    notificationService.getNotificationTemplates(workspaceId).then((res) => setTemplates(res.data || [])).catch(() => {});
  };

  useEffect(load, [workspaceId]);

  const save = async () => {
    setIsSaving(true);
    try {
      await notificationService.saveNotificationTemplate(workspaceId, editing);
      setEditing(null);
      load();
      toast.success('Notification template saved');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notification Templates</h1>
          <p className="text-sm text-slate-500">In-app, Slack, and Telegram templates rendered with Handlebars variables.</p>
        </div>
        <button type="button" onClick={() => setEditing(emptyTemplate)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
          New template
        </button>
      </div>

      {editing && (
        <NotificationTemplateEditor
          value={editing}
          onChange={setEditing}
          onSubmit={save}
          onCancel={() => setEditing(null)}
          isSaving={isSaving}
        />
      )}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        {templates.map((template) => (
          <button key={template._id} type="button" onClick={() => setEditing(template)} className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
            <span>
              <span className="block text-sm font-semibold">{template.name || template.event}</span>
              <span className="text-xs text-slate-500">{template.event}</span>
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {template.channel}
            </span>
          </button>
        ))}
        {!templates.length && <div className="p-6 text-sm text-slate-500">No notification templates configured.</div>}
      </div>
    </div>
  );
}
