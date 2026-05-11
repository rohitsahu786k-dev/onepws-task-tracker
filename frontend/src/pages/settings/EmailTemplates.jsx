import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import NotificationTemplateEditor from '../../components/notifications/NotificationTemplateEditor';
import useAuthStore from '../../store/authStore';
import * as notificationService from '../../services/notification.service';

const emptyTemplate = {
  name: '',
  event: 'task_assigned',
  subject: 'Task Assigned: {{taskNumber}}',
  htmlBody: '<p>Hello {{userName}},</p><p>{{notificationMessage}}</p><p><a href="{{actionUrl}}">Open</a></p>',
  textBody: '{{notificationMessage}}',
  isActive: true
};

export default function EmailTemplates() {
  const workspaceId = useAuthStore((state) => state.workspace?._id || state.user?.defaultWorkspace);
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = () => {
    if (!workspaceId) return;
    notificationService.getEmailTemplates(workspaceId).then((res) => setTemplates(res.data || [])).catch(() => {});
  };

  useEffect(load, [workspaceId]);

  const save = async () => {
    setIsSaving(true);
    try {
      await notificationService.saveEmailTemplate(workspaceId, editing);
      setEditing(null);
      load();
      toast.success('Email template saved');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Email Templates</h1>
          <p className="text-sm text-slate-500">HTML email templates rendered with Handlebars variables.</p>
        </div>
        <button type="button" onClick={() => setEditing(emptyTemplate)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
          New template
        </button>
      </div>

      {editing && (
        <NotificationTemplateEditor
          type="email"
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
            <span className="text-xs text-slate-500">{template.isActive ? 'Active' : 'Inactive'}</span>
          </button>
        ))}
        {!templates.length && <div className="p-6 text-sm text-slate-500">No email templates configured.</div>}
      </div>
    </div>
  );
}
