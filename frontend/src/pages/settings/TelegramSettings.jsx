import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { testTelegramSettings } from '../../services/notification.service';

export default function TelegramSettings() {
  const workspaceId = useAuthStore((state) => state.workspace?._id || state.user?.defaultWorkspace);
  const [message, setMessage] = useState('ONEPWS Telegram test notification.');
  const [isSending, setIsSending] = useState(false);

  const sendTest = async () => {
    setIsSending(true);
    try {
      await testTelegramSettings(workspaceId, { message });
      toast.success('Telegram test sent');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Telegram Notifications</h1>
        <p className="text-sm text-slate-500">Send a test message using the workspace Telegram bot settings.</p>
      </div>
      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <textarea className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={message} onChange={(event) => setMessage(event.target.value)} />
        <button type="button" onClick={sendTest} disabled={isSending || !workspaceId} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {isSending ? 'Sending...' : 'Send test'}
        </button>
      </div>
    </div>
  );
}
