import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import * as meetingApi from '../../api/meeting.api';
import MeetingStatusBadge from '../../components/meetings/MeetingStatusBadge';

const DayMeetingListInner = ({ dayMeetings }) => (
  <div className="space-y-2">
    {dayMeetings.map((meeting) => (
      <article key={meeting._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm dark:border-slate-800">
        <div>
          <Link to={`/meetings/${meeting._id}`} className="font-medium text-blue-600">{meeting.title}</Link>
          <p className="text-xs text-slate-500">
            {meeting.startDateTime ? new Date(meeting.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            {' · '}
            {meeting.meetingType?.replace(/_/g, ' ')}
            {meeting.meetingNumber ? ` · ${meeting.meetingNumber}` : ''}
          </p>
        </div>
        <MeetingStatusBadge status={meeting.status} />
      </article>
    ))}
  </div>
);

const CalendarPageHeader = () => (
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Meeting Calendar</h1>
      <p className="text-sm text-slate-500">Upcoming and past meetings grouped by date.</p>
    </div>
    <div className="flex gap-2">
      <Link to="/meetings" className="rounded-md border px-3 py-2 text-sm">List View</Link>
      <Link to="/meetings/new" className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">Create Meeting</Link>
    </div>
  </div>
);

const MeetingCalendar = () => {
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id;
  const { data, isLoading } = useQuery({
    queryKey: ['meetings-calendar', workspaceId],
    queryFn: () => meetingApi.getMeetings(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const meetings = (data?.data || []).slice().sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
  const grouped = meetings.reduce((acc, meeting) => {
    const key = meeting.startDateTime ? new Date(meeting.startDateTime).toLocaleDateString() : 'Unscheduled';
    if (!acc[key]) acc[key] = [];
    acc[key].push(meeting);
    return acc;
  }, {});

  return (
    <main className="space-y-5">
      <CalendarPageHeader />
      {isLoading && <p className="text-sm text-slate-500">Loading calendar...</p>}
      {!isLoading && Object.entries(grouped).map(([date, dayMeetings]) => (
        <section key={date} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{date}</h2>
          <DayMeetingListInner dayMeetings={dayMeetings} />
        </section>
      ))}
      {!isLoading && !meetings.length && <p className="text-sm text-slate-500">No meetings scheduled.</p>}
    </main>
  );
};

export default MeetingCalendar;
