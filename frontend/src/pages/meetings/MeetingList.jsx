import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarPlus, ExternalLink } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import * as meetingApi from '../../api/meeting.api';
import MeetingStatusBadge from '../../components/meetings/MeetingStatusBadge';

const MeetingList = () => {
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id;
  const { data, isLoading } = useQuery({
    queryKey: ['meetings', workspaceId],
    queryFn: () => meetingApi.getMeetings(workspaceId),
    enabled: Boolean(workspaceId)
  });
  const meetings = data?.data || [];

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Meetings</h1>
          <p className="text-sm text-slate-500">Schedule kickoff, review, client, vendor, and MOM discussion meetings.</p>
        </div>
        <Link to="/meetings/new" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">
          <CalendarPlus size={16} /> Create Meeting
        </Link>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                {['Meeting Number', 'Title', 'Type', 'Mode', 'Date', 'Time', 'Organizer', 'Attendees', 'Project', 'Task', 'Status', 'Link', 'MOM'].map((column) => (
                  <th key={column} className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && <tr><td colSpan={13} className="px-4 py-8 text-center text-slate-500">Loading meetings...</td></tr>}
              {!isLoading && meetings.map((meeting) => {
                const link = meeting.onlineMeeting?.joinUrl || meeting.manualMeetingLink;
                return (
                  <tr key={meeting._id}>
                    <td className="px-4 py-3 font-medium">{meeting.meetingNumber}</td>
                    <td className="px-4 py-3"><Link className="text-blue-600" to={`/meetings/${meeting._id}`}>{meeting.title}</Link></td>
                    <td className="px-4 py-3">{meeting.meetingType?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{meeting.meetingMode?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{meeting.startDateTime ? new Date(meeting.startDateTime).toLocaleDateString() : ''}</td>
                    <td className="px-4 py-3">{meeting.startDateTime ? new Date(meeting.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                    <td className="px-4 py-3">{meeting.createdBy?.name}</td>
                    <td className="px-4 py-3">{meeting.attendees?.length || 0}</td>
                    <td className="px-4 py-3">{meeting.project?.title || meeting.project?.name || ''}</td>
                    <td className="px-4 py-3">{meeting.task?.taskNumber || ''}</td>
                    <td className="px-4 py-3"><MeetingStatusBadge status={meeting.status} /></td>
                    <td className="px-4 py-3">{link && <a href={link} target="_blank" rel="noreferrer" aria-label="Open meeting"><ExternalLink size={16} /></a>}</td>
                    <td className="px-4 py-3">{meeting.mom ? meeting.mom.status : 'No'}</td>
                  </tr>
                );
              })}
              {!isLoading && !meetings.length && <tr><td colSpan={13} className="px-4 py-8 text-center text-slate-500">No meetings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default MeetingList;
