import { Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingLinkBox = ({ meeting }) => {
  const link = meeting?.onlineMeeting?.joinUrl || meeting?.manualMeetingLink;
  if (!link) return <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-500">No online meeting link.</div>;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <a href={link} target="_blank" rel="noreferrer" className="min-w-0 truncate text-sm font-medium text-blue-600">{link}</a>
      <div className="flex items-center gap-2">
        <button className="rounded-md border p-2" onClick={() => { navigator.clipboard.writeText(link); toast.success('Meeting link copied'); }} aria-label="Copy meeting link">
          <Copy size={16} />
        </button>
        <a className="rounded-md border p-2" href={link} target="_blank" rel="noreferrer" aria-label="Open meeting link">
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

export default MeetingLinkBox;
