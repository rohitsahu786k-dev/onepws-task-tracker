import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as calendarService from '../../services/calendar.service';

const EVENT_COLORS = {
  task: '#2563eb',
  tracker_task: '#4f46e5',
  meeting: '#16a34a',
  mom: '#9333ea',
  sla: '#f97316',
  budget: '#ca8a04',
  expense: '#78716c',
  holiday: '#dc2626',
  reminder: '#db2777',
  custom: '#64748b',
};

const EVENT_TYPES = Object.keys(EVENT_COLORS);
const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;
const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const emptyForm = (range = {}) => ({
  title: '',
  description: '',
  eventType: 'custom',
  startDate: toLocalInput(range.start) || toLocalInput(new Date()),
  endDate: toLocalInput(range.end || range.start) || toLocalInput(new Date()),
  allDay: false,
  priority: 'medium',
  status: 'scheduled',
  assignedToText: '',
  department: '',
  project: '',
  location: '',
  color: '',
  reminderMinutes: '30',
  reminderChannel: 'in_app',
  isRecurring: false,
  recurrenceFrequency: 'weekly',
  recurrenceInterval: 1,
  recurrenceMax: 12,
});

const Stat = ({ label, value, color }) => (
  <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
    <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold" style={{ color: color || '#0f172a' }}>{value ?? 0}</p>
  </div>
);

const statusClass = (status) => {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'overdue') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'in_progress') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const sourceUrl = (event) => {
  const props = event?.extendedProps || {};
  if (props.metadata?.sourceUrl) return props.metadata.sourceUrl;
  if (props.refModel === 'Task' && props.refId) return `/tasks/${props.refId}`;
  if (props.refModel === 'Meeting' && props.refId) return `/meetings/${props.refId}`;
  if (props.refModel === 'MOM' && props.refId) return `/mom/${props.refId}`;
  if (props.refModel === 'TrackerRow') return '/tracker';
  return null;
};

const CalendarView = () => {
  const { workspace } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace);
  const queryClient = useQueryClient();
  const [scope, setScope] = useState('all');
  const [filters, setFilters] = useState({ type: '', status: '', priority: '', search: '', department: '', user: '', onlyOverdue: false });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
  });
  const [form, setForm] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const apiFilters = useMemo(() => ({
    start: dateRange.start,
    end: dateRange.end,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.department ? { department: filters.department } : {}),
    ...(filters.user ? { user: filters.user } : {}),
    ...(filters.onlyOverdue ? { onlyOverdue: 'true' } : {}),
  }), [dateRange, filters]);

  const eventsQuery = useQuery({
    queryKey: ['calendarEvents', workspaceId, scope, apiFilters],
    queryFn: () => {
      if (scope === 'my') return calendarService.getMyEvents(workspaceId, apiFilters);
      if (scope === 'team' || scope === 'department') return calendarService.getTeamEvents(workspaceId, apiFilters);
      return calendarService.getEvents(workspaceId, apiFilters);
    },
    enabled: !!workspaceId,
  });

  const summaryQuery = useQuery({
    queryKey: ['calendarSummary', workspaceId, apiFilters],
    queryFn: () => calendarService.getSummary(workspaceId, apiFilters),
    enabled: !!workspaceId,
  });

  const events = useMemo(() => eventsQuery.data?.events || eventsQuery.data?.data || [], [eventsQuery.data]);
  const summary = summaryQuery.data?.summary || summaryQuery.data?.data || {};

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['calendarEvents', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['calendarSummary', workspaceId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => calendarService.createEvent(workspaceId, payload),
    onSuccess: () => {
      setForm(null);
      invalidate();
      toast.success('Event created');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Event create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ eventId, payload }) => calendarService.updateEvent(workspaceId, eventId, payload),
    onSuccess: () => {
      setForm(null);
      invalidate();
      toast.success('Event updated');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Event update failed'),
  });

  const completeMutation = useMutation({
    mutationFn: (eventId) => calendarService.completeEvent(workspaceId, eventId),
    onSuccess: () => {
      setSelectedEvent(null);
      invalidate();
      toast.success('Event completed');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Complete failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId) => calendarService.cancelEvent(workspaceId, eventId, 'Cancelled from calendar'),
    onSuccess: () => {
      setSelectedEvent(null);
      invalidate();
      toast.success('Event cancelled');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Cancel failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId) => calendarService.deleteEvent(workspaceId, eventId),
    onSuccess: () => {
      setSelectedEvent(null);
      invalidate();
      toast.success('Event deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Delete failed'),
  });

  const exportMutation = useMutation({
    mutationFn: (type) => type === 'pdf' ? calendarService.exportPdf(workspaceId, apiFilters) : calendarService.exportExcel(workspaceId, apiFilters),
    onError: (error) => toast.error(error.response?.data?.message || 'Export failed'),
  });

  const buildPayload = () => {
    const assignedTo = form.assignedToText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const reminders = form.reminderMinutes
      ? [{ minutesBefore: Number(form.reminderMinutes), channel: form.reminderChannel, sent: false }]
      : [];

    return {
      title: form.title,
      description: form.description,
      eventType: form.eventType,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      allDay: form.allDay,
      priority: form.priority,
      status: form.status,
      assignedTo,
      department: form.department || undefined,
      project: form.project || undefined,
      location: form.location,
      color: form.color || EVENT_COLORS[form.eventType],
      reminders,
      isRecurring: form.isRecurring,
      recurrenceRule: form.isRecurring ? {
        frequency: form.recurrenceFrequency,
        interval: Number(form.recurrenceInterval) || 1,
        maxOccurrences: Number(form.recurrenceMax) || 12,
      } : undefined,
    };
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const payload = buildPayload();
    if (payload.assignedTo.length && payload.startDate && payload.endDate) {
      const conflict = await calendarService.checkConflict(workspaceId, {
        attendees: payload.assignedTo,
        startDate: payload.startDate,
        endDate: payload.endDate,
        excludeEventId: form._id,
      });
      if (conflict.hasConflict && !window.confirm(`${conflict.conflicts.length} conflict(s) found. Continue anyway?`)) return;
    }
    if (form._id) updateMutation.mutate({ eventId: form._id, payload });
    else createMutation.mutate(payload);
  };

  const openEdit = (eventApi) => {
    const props = eventApi.extendedProps || {};
    setForm({
      ...emptyForm(),
      _id: eventApi.id,
      title: eventApi.title,
      description: props.description || '',
      eventType: props.eventType || 'custom',
      startDate: toLocalInput(eventApi.start),
      endDate: toLocalInput(eventApi.end || eventApi.start),
      allDay: eventApi.allDay,
      priority: props.priority || 'medium',
      status: props.status || 'scheduled',
      assignedToText: (props.assignedTo || []).map((item) => item._id || item).join(','),
      department: props.department?._id || props.department || '',
      project: props.project?._id || props.project || '',
      location: props.location || '',
      color: eventApi.backgroundColor || EVENT_COLORS[props.eventType || 'custom'],
      reminderMinutes: props.reminders?.[0]?.minutesBefore || '',
      reminderChannel: props.reminders?.[0]?.channel || 'in_app',
      isRecurring: props.isRecurring || false,
      recurrenceFrequency: 'weekly',
      recurrenceInterval: 1,
      recurrenceMax: 12,
      isSystemGenerated: props.isSystemGenerated,
      isEditable: props.isEditable,
    });
  };

  const handleEventDrop = (info) => {
    const props = info.event.extendedProps;
    if (props.isSystemGenerated || props.isEditable === false) {
      info.revert();
      toast.error('System events source module se update honge.');
      return;
    }
    updateMutation.mutate({
      eventId: info.event.id,
      payload: {
        startDate: info.event.startStr,
        endDate: info.event.endStr || info.event.startStr,
        allDay: info.event.allDay,
        dragged: true,
      },
    });
  };

  const handleSelect = (selectInfo) => {
    setForm(emptyForm({ start: selectInfo.start, end: selectInfo.end }));
  };

  if (!workspaceId) {
    return (
      <main className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">Select a workspace to use Calendar</h1>
        <p className="mt-2 text-sm text-slate-500">Calendar events are workspace specific.</p>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-[calc(100vh-8rem)] flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-950">
            <CalendarDays size={24} /> Workspace Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">Tasks, tracker rows, meetings, MOMs, SLA deadlines, budgets, expenses, holidays, reminders, and manual events in one calendar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => eventsQuery.refetch()} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => exportMutation.mutate('excel')} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download size={16} /> Excel
          </button>
          <button onClick={() => exportMutation.mutate('pdf')} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download size={16} /> PDF
          </button>
          <button onClick={() => setForm(emptyForm())} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90">
            <Plus size={16} /> New Event
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Events" value={summary.totalEvents} />
        <Stat label="Tasks" value={summary.taskEvents} color={EVENT_COLORS.task} />
        <Stat label="Meetings" value={summary.meetingEvents} color={EVENT_COLORS.meeting} />
        <Stat label="SLA" value={summary.slaEvents} color={EVENT_COLORS.sla} />
        <Stat label="Overdue" value={summary.overdueEvents} color="#dc2626" />
        <Stat label="Next 7 Days" value={summary.upcoming7Days} color="#4f46e5" />
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-3">
        <select value={scope} onChange={(event) => setScope(event.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option value="all">All Workspace</option>
          <option value="my">My Calendar</option>
          <option value="team">Team Calendar</option>
          <option value="department">Department Calendar</option>
        </select>
        <select value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option value="">All Types</option>
          {EVENT_TYPES.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option value="">All Status</option>
          {['scheduled', 'pending', 'in_progress', 'completed', 'overdue', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={filters.priority} onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option value="">All Priority</option>
          {['low', 'medium', 'high', 'urgent'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <input value={filters.department} onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))} placeholder="Department ID" className="h-9 w-36 rounded-md border border-slate-300 px-3 text-sm" />
        <input value={filters.user} onChange={(event) => setFilters((prev) => ({ ...prev, user: event.target.value }))} placeholder="User ID" className="h-9 w-36 rounded-md border border-slate-300 px-3 text-sm" />
        <label className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-700">
          <input type="checkbox" checked={filters.onlyOverdue} onChange={(event) => setFilters((prev) => ({ ...prev, onlyOverdue: event.target.checked }))} />
          Overdue
        </label>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
          <input value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search task number, title, source" className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Filter size={14} /> {events.length} visible
        </div>
      </section>

      <section className="min-h-[650px] flex-1 rounded-md border border-slate-200 bg-white p-3">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          events={events}
          datesSet={(dateInfo) => setDateRange({ start: dateInfo.startStr, end: dateInfo.endStr })}
          eventClick={(clickInfo) => setSelectedEvent(clickInfo.event)}
          selectable
          selectMirror
          select={handleSelect}
          editable
          eventDrop={handleEventDrop}
          eventResize={handleEventDrop}
          eventAllow={(_, draggedEvent) => draggedEvent.extendedProps.isEditable === true && draggedEvent.extendedProps.isSystemGenerated !== true}
          height="100%"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          dayMaxEvents
        />
      </section>

      <section className="flex flex-wrap items-center gap-4 text-sm">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize text-slate-600">{type.replace('_', ' ')}</span>
          </div>
        ))}
      </section>

      {selectedEvent ? (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl">
          <div className="flex items-start justify-between border-b border-slate-200 p-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">{selectedEvent.extendedProps.eventType}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">{selectedEvent.title}</h2>
            </div>
            <button onClick={() => setSelectedEvent(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${statusClass(selectedEvent.extendedProps.status)}`}>
              {selectedEvent.extendedProps.status}
            </span>
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-slate-500">Start</dt><dd className="font-medium text-slate-900">{selectedEvent.start?.toLocaleString()}</dd></div>
              <div><dt className="text-slate-500">End</dt><dd className="font-medium text-slate-900">{selectedEvent.end?.toLocaleString() || selectedEvent.start?.toLocaleString()}</dd></div>
              <div><dt className="text-slate-500">Priority</dt><dd className="font-medium text-slate-900">{selectedEvent.extendedProps.priority}</dd></div>
              <div><dt className="text-slate-500">Source</dt><dd className="font-medium text-slate-900">{selectedEvent.extendedProps.refModel || 'Manual'}</dd></div>
            </dl>
            {selectedEvent.extendedProps.description ? <p className="rounded-md bg-slate-50 p-3 text-slate-700">{selectedEvent.extendedProps.description}</p> : null}
            {selectedEvent.extendedProps.metadata?.sourceNumber ? <p className="text-sm text-slate-600">Source number: <span className="font-medium">{selectedEvent.extendedProps.metadata.sourceNumber}</span></p> : null}
            {selectedEvent.extendedProps.reminders?.length ? (
              <div>
                <p className="font-medium text-slate-900">Reminders</p>
                <ul className="mt-2 space-y-1">
                  {selectedEvent.extendedProps.reminders.map((reminder, index) => (
                    <li key={reminder._id || index} className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">
                      {reminder.minutesBefore} minutes before via {reminder.channel}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="grid gap-2 border-t border-slate-200 p-4 sm:grid-cols-2">
            {sourceUrl(selectedEvent) ? (
              <a href={sourceUrl(selectedEvent)} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white">
                <ExternalLink size={15} /> Open Source
              </a>
            ) : null}
            {selectedEvent.extendedProps.isEditable ? (
              <button onClick={() => openEdit(selectedEvent)} className="h-9 rounded-md border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit</button>
            ) : null}
            <button onClick={() => completeMutation.mutate(selectedEvent.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-emerald-200 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
              <CheckCircle2 size={15} /> Complete
            </button>
            <button onClick={() => cancelMutation.mutate(selectedEvent.id)} className="h-9 rounded-md border border-amber-200 text-sm font-medium text-amber-700 hover:bg-amber-50">Cancel</button>
            {selectedEvent.extendedProps.isEditable ? (
              <button onClick={() => deleteMutation.mutate(selectedEvent.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-200 text-sm font-medium text-red-700 hover:bg-red-50">
                <Trash2 size={15} /> Delete
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}

      {form ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <form onSubmit={submitForm} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">{form._id ? 'Edit Event' : 'Create Event'}</h2>
              <button type="button" onClick={() => setForm(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {form.isSystemGenerated ? (
              <div className="mx-5 mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                System event source module se controlled hai. Admin ke alawa direct edit block rahega.
              </div>
            ) : null}
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" required />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Type</span>
                <select value={form.eventType} onChange={(event) => setForm((prev) => ({ ...prev, eventType: event.target.value, color: EVENT_COLORS[event.target.value] }))} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                  {EVENT_TYPES.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Priority</span>
                <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                  {['low', 'medium', 'high', 'urgent'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Start</span>
                <input type="datetime-local" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" required />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">End</span>
                <input type="datetime-local" value={form.endDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.allDay} onChange={(event) => setForm((prev) => ({ ...prev, allDay: event.target.checked }))} />
                All day
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                  {['scheduled', 'pending', 'in_progress', 'completed', 'overdue', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Assigned User IDs</span>
                <input value={form.assignedToText} onChange={(event) => setForm((prev) => ({ ...prev, assignedToText: event.target.value }))} placeholder="comma,separated,userIds" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Department ID</span>
                <input value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Project ID</span>
                <input value={form.project} onChange={(event) => setForm((prev) => ({ ...prev, project: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Reminder</span>
                <select value={form.reminderMinutes} onChange={(event) => setForm((prev) => ({ ...prev, reminderMinutes: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option value="">No reminder</option>
                  <option value="10">10 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="1440">1 day</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Channel</span>
                <select value={form.reminderChannel} onChange={(event) => setForm((prev) => ({ ...prev, reminderChannel: event.target.value }))} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option value="in_app">In-app</option>
                  <option value="email">Email</option>
                  <option value="both">Both</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isRecurring} onChange={(event) => setForm((prev) => ({ ...prev, isRecurring: event.target.checked }))} />
                Recurring event
              </label>
              {form.isRecurring ? (
                <div className="grid gap-3 rounded-md border border-slate-200 p-3 md:col-span-2 md:grid-cols-3">
                  <select value={form.recurrenceFrequency} onChange={(event) => setForm((prev) => ({ ...prev, recurrenceFrequency: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <input type="number" min="1" value={form.recurrenceInterval} onChange={(event) => setForm((prev) => ({ ...prev, recurrenceInterval: event.target.value }))} className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Interval" />
                  <input type="number" min="1" value={form.recurrenceMax} onChange={(event) => setForm((prev) => ({ ...prev, recurrenceMax: event.target.value }))} className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Max occurrences" />
                </div>
              ) : null}
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setForm(null)} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700">Cancel</button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">
                {form._id ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
};

export default CalendarView;
