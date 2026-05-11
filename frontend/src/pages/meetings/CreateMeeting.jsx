import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as meetingApi from '../../api/meeting.api';
import MeetingConflictWarning from '../../components/meetings/MeetingConflictWarning';
import MeetingReminderSettings from '../../components/meetings/MeetingReminderSettings';

const meetingTypes = ['kickoff', 'internal', 'client', 'vendor', 'design_review', 'sla_review', 'budget_review', 'project_review', 'mom_discussion', 'general'];
const meetingModes = ['physical', 'zoom', 'google_meet', 'manual_link', 'hybrid'];

const CreateMeeting = () => {
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id;
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [form, setForm] = useState({
    title: '',
    meetingType: 'general',
    meetingMode: 'physical',
    description: '',
    agenda: '',
    startDateTime: '',
    endDateTime: '',
    timezone: 'Asia/Kolkata',
    location: '',
    manualMeetingLink: '',
    attendeeEmails: '',
    externalAttendees: '',
    reminders: [1440, 30],
    addZoomLink: false,
    addGoogleMeetLink: false,
    allowConflicts: false
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const buildPayload = () => ({
    title: form.title,
    description: form.description,
    agenda: form.agenda,
    meetingType: form.meetingType,
    meetingMode: form.meetingMode,
    startDateTime: form.startDateTime,
    endDateTime: form.endDateTime,
    timezone: form.timezone,
    location: form.location,
    manualMeetingLink: form.manualMeetingLink,
    attendees: [],
    externalAttendees: form.externalAttendees.split('\n').map((line) => {
      const [name, email] = line.split(',').map((item) => item?.trim());
      return email ? { name, email, attendeeType: 'external' } : null;
    }).filter(Boolean),
    reminders: form.reminders.map((minutesBefore) => ({ minutesBefore, channel: 'both', sent: false })),
    addZoomLink: form.addZoomLink,
    addGoogleMeetLink: form.addGoogleMeetLink,
    allowConflicts: form.allowConflicts
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await meetingApi.createMeeting(workspaceId, buildPayload());
      toast.success('Meeting created');
      navigate(`/meetings/${res.data._id}`);
    } catch (error) {
      if (error.response?.status === 409) {
        setConflicts(error.response.data.conflicts || []);
        return;
      }
      toast.error(error.response?.data?.message || 'Meeting creation failed');
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Create Meeting</h1>
        <p className="text-sm text-slate-500">Schedule a formal meeting and auto-create calendar, notification, and invite records.</p>
      </div>

      <MeetingConflictWarning conflicts={conflicts} onContinue={() => { update('allowConflicts', true); setConflicts([]); }} />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Meeting Title" required value={form.title} onChange={(value) => update('title', value)} />
          <Select label="Meeting Type" value={form.meetingType} onChange={(value) => update('meetingType', value)} options={meetingTypes} />
          <Select label="Meeting Mode" value={form.meetingMode} onChange={(value) => update('meetingMode', value)} options={meetingModes} />
          <Field label="Timezone" value={form.timezone} onChange={(value) => update('timezone', value)} />
          <Field label="Start Date & Time" type="datetime-local" required value={form.startDateTime} onChange={(value) => update('startDateTime', value)} />
          <Field label="End Date & Time" type="datetime-local" required value={form.endDateTime} onChange={(value) => update('endDateTime', value)} />
          <Field label="Physical Location" value={form.location} onChange={(value) => update('location', value)} />
          <Field label="Manual Meeting Link" value={form.manualMeetingLink} onChange={(value) => update('manualMeetingLink', value)} />
        </div>

        <Textarea label="Description" value={form.description} onChange={(value) => update('description', value)} />
        <Textarea label="Agenda" value={form.agenda} onChange={(value) => update('agenda', value)} />
        <Textarea label="External Attendees" placeholder="Name, email@company.com" value={form.externalAttendees} onChange={(value) => update('externalAttendees', value)} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.addZoomLink} onChange={(event) => update('addZoomLink', event.target.checked)} /> Add Zoom Link</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.addGoogleMeetLink} onChange={(event) => update('addGoogleMeetLink', event.target.checked)} /> Add Google Meet Link</label>
        </div>

        <MeetingReminderSettings value={form.reminders} onChange={(value) => update('reminders', value)} />

        <div className="flex justify-end">
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">Create Meeting</button>
        </div>
      </form>
    </main>
  );
};

const Field = ({ label, value, onChange, type = 'text', required }) => (
  <label className="space-y-1 text-sm">
    <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
  </label>
);

const Select = ({ label, value, onChange, options }) => (
  <label className="space-y-1 text-sm">
    <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      {options.map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}
    </select>
  </label>
);

const Textarea = ({ label, value, onChange, placeholder }) => (
  <label className="space-y-1 text-sm">
    <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <textarea rows={3} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
  </label>
);

export default CreateMeeting;
