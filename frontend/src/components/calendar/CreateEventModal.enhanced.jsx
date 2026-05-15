/**
 * CreateEventModal.jsx - Complete Calendar Event Creation
 * Integrates with FullCalendar for drag-and-drop event creation
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { X, Clock, Users, Repeat } from 'lucide-react';

// ========== VALIDATION SCHEMA ==========
const createEventSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  type: z.enum(['Task', 'Meeting', 'Reminder', 'MOM', 'Budget', 'Custom']).default('Custom'),
  startDate: z.date().required(),
  startTime: z.string().optional(),
  endDate: z.date().optional(),
  endTime: z.string().optional(),
  allDay: z.boolean().default(false),
  description: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  color: z.string().default('#3788d8'),
  reminderMinutes: z.number().optional(),
  linkedTaskId: z.string().optional(),
  linkedMeetingId: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none')
});

export const CreateEventModal = ({ isOpen, onClose, workspaceId, calendarRef, dateClickInfo }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      allDay: dateClickInfo?.allDay || false,
      startDate: dateClickInfo?.date || new Date(),
      color: '#3788d8',
      type: 'Custom',
      recurrence: 'none',
      attendees: [],
      reminderMinutes: 30
    }
  });

  const allDay = watch('allDay');
  const startDate = watch('startDate');
  const eventType = watch('type');

  // ========== FETCH MEMBERS & LINKED DATA ==========
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [membersRes, tasksRes] = await Promise.all([
          axios.get(`/api/workspaces/${workspaceId}/members`),
          axios.get(`/api/workspaces/${workspaceId}/tasks`, { params: { limit: 100 } })
        ]);

        setMembers(membersRes.data.data || []);
        setTasks(tasksRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, [isOpen, workspaceId]);

  // ========== FORM SUBMIT ==========
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Combine date and time
      const startDateTime = new Date(data.startDate);
      if (!data.allDay && data.startTime) {
        const [hours, minutes] = data.startTime.split(':');
        startDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      let endDateTime = data.endDate ? new Date(data.endDate) : new Date(startDateTime);
      if (!data.allDay && data.endTime) {
        const [hours, minutes] = data.endTime.split(':');
        endDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      const payload = {
        title: data.title,
        type: data.type,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: data.allDay,
        description: data.description || '',
        attendees: data.attendees || [],
        color: data.color,
        reminderMinutes: data.reminderMinutes,
        refId: data.linkedTaskId || data.linkedMeetingId || null,
        refModel: data.linkedTaskId ? 'Task' : data.linkedMeetingId ? 'Meeting' : null,
        isRecurring: data.recurrence !== 'none',
        recurrenceRule: data.recurrence
      };

      const res = await axios.post(
        `/api/workspaces/${workspaceId}/calendar/events`,
        payload
      );

      // Add event to FullCalendar
      if (calendarRef?.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.addEvent({
          id: res.data.data._id,
          title: res.data.data.title,
          start: res.data.data.startDate,
          end: res.data.data.endDate,
          allDay: res.data.data.allDay,
          backgroundColor: res.data.data.color,
          extendedProps: {
            type: res.data.data.type,
            attendees: res.data.data.attendees
          }
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries(['calendarEvents']);

      toast.success('Event created successfully!');
      reset();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const colors = [
    { name: 'Red', value: '#f44336' },
    { name: 'Blue', value: '#3788d8' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Pink', value: '#e91e63' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        
        {/* ========== HEADER ========== */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">+ New Event</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X size={24} />
          </button>
        </div>

        {/* ========== FORM ========== */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* ========== ROW 1: Title & Type ========== */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Project Review Meeting"
                {...register('title')}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-blue-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Event Type
              </label>
              <select
                {...register('type')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="Custom">Custom</option>
                <option value="Task">Task</option>
                <option value="Meeting">Meeting</option>
                <option value="Reminder">Reminder</option>
                <option value="MOM">MOM</option>
                <option value="Budget">Budget</option>
              </select>
            </div>
          </div>

          {/* ========== ROW 2: Date & Time ========== */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                {...register('startDate', {
                  setValueAs: (v) => new Date(v)
                })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {!allDay && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Clock size={14} className="inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  {...register('startTime')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            )}

            <div className={!allDay ? '' : 'col-span-2'}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                {...register('endDate', {
                  setValueAs: (v) => v ? new Date(v) : undefined
                })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {!allDay && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  {...register('endTime')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            )}
          </div>

          {/* ========== ALL DAY TOGGLE ========== */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              {...register('allDay')}
              className="rounded border-slate-300"
            />
            <label htmlFor="allDay" className="text-sm font-semibold text-slate-700">
              All Day Event
            </label>
          </div>

          {/* ========== DESCRIPTION ========== */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Add event details..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* ========== ROW 3: Attendees & Reminder ========== */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Users size={14} className="inline mr-1" />
                Attendees
              </label>
              <select
                {...register('attendees')}
                multiple
                size={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {members.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd for multiple</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Reminder Before
              </label>
              <select
                {...register('reminderMinutes', { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">None</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={1440}>1 day</option>
                <option value={2880}>2 days</option>
              </select>
            </div>
          </div>

          {/* ========== ROW 4: Color & Recurrence ========== */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <label key={color.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value={color.value}
                      {...register('color')}
                      className="mr-2"
                    />
                    <div
                      className="w-6 h-6 rounded-full border-2 border-slate-300"
                      style={{ backgroundColor: color.value }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Repeat size={14} className="inline mr-1" />
                Repeat
              </label>
              <select
                {...register('recurrence')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* ========== LINK TO TASK/MEETING ========== */}
          {eventType === 'Task' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Link to Task
              </label>
              <select
                {...register('linkedTaskId')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">None</option>
                {tasks.map(task => (
                  <option key={task._id} value={task._id}>
                    {task.taskNumber} - {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ========== FOOTER ========== */}
          <div className="flex gap-4 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
