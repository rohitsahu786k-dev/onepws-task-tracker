import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as meetingApi from '../../api/meeting.api';
import MeetingStatusBadge from '../../components/meetings/MeetingStatusBadge';
import MeetingLinkBox from '../../components/meetings/MeetingLinkBox';

const MeetingDetail = () => {
  const { id } = useParams();
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['meeting', workspaceId, id],
    queryFn: () => meetingApi.getMeeting(workspaceId, id),
    enabled: Boolean(workspaceId && id)
  });
  const meeting = data?.data;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['meeting', workspaceId, id] });
  const complete = useMutation({ mutationFn: () => meetingApi.completeMeeting(workspaceId, id), onSuccess: () => { toast.success('Meeting completed'); refresh(); } });
  const createMom = useMutation({ mutationFn: () => meetingApi.createMOMFromMeeting(workspaceId, id), onSuccess: () => { toast.success('MOM created'); refresh(); } });
  const sendInvite = useMutation({ mutationFn: () => meetingApi.sendMeetingInvite(workspaceId, id), onSuccess: () => toast.success('Invite sent') });
  const cancel = useMutation({
    mutationFn: (reason) => meetingApi.cancelMeeting(workspaceId, id, reason),
    onSuccess: () => { toast.success('Meeting cancelled'); refresh(); }
  });

  if (isLoading) return <div className="p-6 text-sm text-slate-500">Loading meeting...</div>;
  if (!meeting) return <div className="p-6 text-sm text-slate-500">Meeting not found.</div>;

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{meeting.title}</h1>
            <MeetingStatusBadge status={meeting.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{meeting.meetingNumber} · {meeting.meetingType?.replace(/_/g, ' ')} · {meeting.meetingMode?.replace(/_/g, ' ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => sendInvite.mutate()} className="rounded-md border px-3 py-2 text-sm">Send Invite</button>
          <button onClick={() => complete.mutate()} className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white">Mark Complete</button>
          <button onClick={() => createMom.mutate()} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">Create MOM</button>
          <button onClick={() => { const reason = window.prompt('Cancellation reason'); if (reason) cancel.mutate(reason); }} className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white">Cancel</button>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel title="Meeting Summary">
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Start" value={new Date(meeting.startDateTime).toLocaleString()} />
              <Info label="End" value={new Date(meeting.endDateTime).toLocaleString()} />
              <Info label="Timezone" value={meeting.timezone} />
              <Info label="Duration" value={`${meeting.durationMinutes || 0} minutes`} />
              <Info label="Project" value={meeting.project?.title || meeting.project?.name} />
              <Info label="Task" value={meeting.task?.taskNumber} />
            </div>
          </Panel>
          <Panel title="Agenda">
            <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{meeting.agenda || 'No agenda added.'}</p>
          </Panel>
          <Panel title="Location / Online Link">
            <MeetingLinkBox meeting={meeting} />
            {meeting.location && <p className="mt-3 text-sm text-slate-600">{meeting.location}</p>}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Attendees">
            <div className="space-y-3">
              {(meeting.attendees || []).map((attendee) => (
                <div key={attendee._id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p className="font-medium">{attendee.name || attendee.user?.name}</p>
                  <p className="text-slate-500">{attendee.email || attendee.user?.email}</p>
                  <MeetingStatusBadge status={attendee.responseStatus} />
                </div>
              ))}
              {(meeting.externalAttendees || []).map((attendee) => (
                <div key={attendee._id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p className="font-medium">{attendee.name}</p>
                  <p className="text-slate-500">{attendee.email}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="MOM Status">
            <p className="text-sm">{meeting.mom ? `${meeting.mom.momNumber || 'MOM'} · ${meeting.mom.status}` : 'MOM not created yet.'}</p>
          </Panel>
        </div>
      </section>
    </main>
  );
};

const Panel = ({ title, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
    <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
    {children}
  </section>
);

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{value || '-'}</p>
  </div>
);

export default MeetingDetail;
