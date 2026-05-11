import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import NotificationPreferencePanel from '../../components/notifications/NotificationPreferencePanel';
import useAuthStore from '../../store/authStore';
import * as notificationService from '../../services/notification.service';

export default function EmailNotifSettings() {
  const workspaceId = useAuthStore((state) => state.workspace?._id || state.user?.defaultWorkspace);
  const [prefs, setPrefs] = useState({ preferences: {} });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    notificationService.getNotificationPreferences(workspaceId).then((res) => setPrefs(res.data || { preferences: {} })).catch(() => {});
  }, [workspaceId]);

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await notificationService.updateNotificationPreferences(workspaceId, prefs);
      setPrefs(res.data);
      toast.success('Notification preferences saved');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Notification Preferences</h1>
        <p className="text-sm text-slate-500">Choose which channels you want for operational alerts.</p>
      </div>
      <NotificationPreferencePanel value={prefs} onChange={setPrefs} onSave={save} isSaving={isSaving} />
    </div>
  );
}
