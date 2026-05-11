import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
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
  custom: '#64748b'
};

const CalendarView = () => {
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id || 'mock-workspace-id';
  const [calendarScope, setCalendarScope] = useState('all');
  const [eventType, setEventType] = useState('');

  // We will track the current view dates to fetch data efficiently
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['calendarEvents', workspaceId, dateRange.start, dateRange.end, calendarScope, eventType],
    queryFn: () => {
      const params = {
        start: dateRange.start,
        end: dateRange.end,
        ...(eventType ? { type: eventType } : {})
      };
      if (calendarScope === 'my') return calendarService.getMyEvents(workspaceId, params);
      return calendarService.getEvents(workspaceId, params);
    },
    enabled: !!workspaceId,
  });

  const events = useMemo(() => {
    return data?.events || data?.data || [];
  }, [data]);

  const handleDatesSet = (dateInfo) => {
    setDateRange({
      start: dateInfo.startStr,
      end: dateInfo.endStr
    });
  };

  const handleEventClick = (clickInfo) => {
    const props = clickInfo.event.extendedProps;
    alert(`Event: ${clickInfo.event.title}\nType: ${props.eventType}\nStatus: ${props.status}\nSource: ${props.refModel || 'Manual'}`);
    // Ideally open a modal here
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Calendar</h1>
        <div className="flex items-center gap-3">
          <select
            value={calendarScope}
            onChange={(event) => setCalendarScope(event.target.value)}
            className="px-3 py-2 border rounded text-sm bg-white dark:bg-slate-950 dark:border-slate-800"
          >
            <option value="all">All Workspace Events</option>
            <option value="my">My Calendar</option>
          </select>
          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="px-3 py-2 border rounded text-sm bg-white dark:bg-slate-950 dark:border-slate-800"
          >
            <option value="">All Types</option>
            <option value="task">Tasks</option>
            <option value="tracker_task">Tracker</option>
            <option value="meeting">Meetings</option>
            <option value="mom">MOM</option>
            <option value="sla">SLA</option>
            <option value="budget">Budget</option>
            <option value="expense">Expense</option>
            <option value="holiday">Holidays</option>
            <option value="reminder">Reminders</option>
            <option value="custom">Custom</option>
          </select>
          <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm font-medium">
            + New Event
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-950 p-4 border dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="h-[calc(100vh-12rem)] min-h-[600px] fc-theme-standard">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            selectable={true}
            editable={true}
            eventAllow={(dropInfo, draggedEvent) => draggedEvent.extendedProps.isEditable === true}
            height="100%"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            dayMaxEvents={true}
          />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
