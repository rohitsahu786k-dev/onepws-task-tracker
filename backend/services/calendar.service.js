const CalendarEvent = require('../models/CalendarEvent');
const { notify } = require('./notification.service');
const { writeCalendarAudit } = require('./calendarAudit.service');
const dayjs = require('dayjs');

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

const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
};

const taskStatusToCalendarStatus = (status, dueDate) => {
  if (status === 'closed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'in_process' || status === 'review') return 'in_progress';
  if (dueDate && new Date(dueDate) < new Date() && !['closed', 'cancelled'].includes(status)) return 'overdue';
  return 'pending';
};

const sourceStatusToCalendarStatus = (status) => {
  if (['completed', 'closed', 'signed', 'approved', 'paid'].includes(status)) return 'completed';
  if (['cancelled', 'rejected'].includes(status)) return 'cancelled';
  if (['in_progress', 'partially_signed', 'active'].includes(status)) return 'in_progress';
  if (status === 'overdue' || status === 'breached' || status === 'delayed') return 'overdue';
  return status || 'scheduled';
};

const syncSystemEvent = async (query, updateData) => {
  const existing = await CalendarEvent.findOne(query);
  const payload = {
    ...updateData,
    color: updateData.color || EVENT_COLORS[query.eventType] || EVENT_COLORS.custom,
    isSystemGenerated: true,
    isEditable: false,
  };

  if (existing) {
    if (existing.status === 'cancelled' && updateData.status !== 'cancelled') return existing;
    const oldValue = {
      title: existing.title,
      startDate: existing.startDate,
      endDate: existing.endDate,
      status: existing.status,
      assignedTo: existing.assignedTo,
    };
    Object.assign(existing, payload);
    await existing.save();
    await writeCalendarAudit({
      workspace: existing.workspace,
      action: 'source_sync_updated',
      eventId: existing._id,
      description: `Source sync updated ${existing.title}`,
      oldValue,
      newValue: {
        title: existing.title,
        startDate: existing.startDate,
        endDate: existing.endDate,
        status: existing.status,
        assignedTo: existing.assignedTo,
      },
    });
    return existing;
  }

  const event = await CalendarEvent.create({ ...query, ...payload });
  await writeCalendarAudit({
    workspace: event.workspace,
    action: 'source_sync_created',
    eventId: event._id,
    description: `Source sync created ${event.title}`,
    newValue: { eventType: event.eventType, refModel: event.refModel, refId: event.refId },
  });
  return event;
};

const syncTaskEvent = async (task) => {
  if (!task?.dueDate) return null;

  return syncSystemEvent(
    {
      workspace: task.workspace,
      refModel: 'Task',
      refId: task._id,
      eventType: 'task',
    },
    {
      title: `Due: ${task.taskNumber || 'Task'} - ${task.title}`,
      description: task.description || `Task due date for ${task.title}`,
      startDate: task.dueDate,
      endDate: task.dueDate,
      allDay: true,
      status: taskStatusToCalendarStatus(task.status, task.dueDate),
      priority: task.priority || 'medium',
      assignedTo: task.assignedTo || [],
      department: task.requestedByDepartment || task.department,
      project: task.project,
      task: task._id,
      metadata: {
        source: 'task',
        sourceNumber: task.taskNumber,
        sourceStatus: task.status,
        sourceUrl: `/tasks/${task._id}`,
      },
    }
  );
};

const cancelTaskEvent = async (task, reason = 'Task cancelled or deleted') => {
  return CalendarEvent.findOneAndUpdate(
    { workspace: task.workspace, refModel: 'Task', refId: task._id, eventType: 'task' },
    { status: 'cancelled', 'metadata.cancelledReason': reason },
    { new: true }
  );
};

const syncTrackerEvent = async (trackerRow) => {
  if (trackerRow.task) return null;

  const rowData = mapToObject(trackerRow.rowData);
  const calculatedData = mapToObject(trackerRow.calculatedData);
  const targetDate = calculatedData.my_target_due_date;
  if (!targetDate) return null;

  const status = rowData.final_status === 'submitted' || rowData.final_status === 'closed'
    ? 'completed'
    : calculatedData.delay_in_task_closure > 0 ? 'overdue' : 'pending';

  return syncSystemEvent(
    {
      workspace: trackerRow.workspace,
      refModel: 'TrackerRow',
      refId: trackerRow._id,
      eventType: 'tracker_task',
    },
    {
      title: `Tracker Due: ${calculatedData.task_number || 'Unknown'} - ${rowData.type_of_task || 'Task'}`,
      startDate: targetDate,
      endDate: targetDate,
      allDay: true,
      status,
      assignedTo: rowData.task_handled_by ? [rowData.task_handled_by] : [],
      department: rowData.task_given_by_department,
      metadata: {
        source: 'tracker',
        sourceNumber: calculatedData.task_number,
        sourceStatus: rowData.final_status,
        sourceUrl: `/tracker`,
        actualCompletionDate: rowData.actual_closing_date,
      },
    }
  );
};

const syncMeetingEvent = async (meeting) => {
  if (!meeting?.startDateTime) return null;

  return syncSystemEvent(
    {
      workspace: meeting.workspace,
      refModel: 'Meeting',
      refId: meeting._id,
      eventType: 'meeting',
    },
    {
      title: `Meeting: ${meeting.title}`,
      description: meeting.agenda || meeting.description,
      startDate: meeting.startDateTime,
      endDate: meeting.endDateTime || meeting.startDateTime,
      allDay: false,
      status: sourceStatusToCalendarStatus(meeting.status),
      assignedTo: meeting.attendees?.map((attendee) => attendee.user).filter(Boolean) || [],
      project: meeting.project,
      task: meeting.task,
      reminders: meeting.reminders || [{ minutesBefore: 30, channel: 'in_app', sent: false }],
      metadata: {
        source: 'meeting',
        sourceNumber: meeting.meetingNumber,
        sourceStatus: meeting.status,
        sourceUrl: `/meetings/${meeting._id}`,
        meetingLink: meeting.onlineMeeting?.joinUrl || meeting.manualMeetingLink,
        locationType: meeting.meetingMode,
      },
    }
  );
};

const syncMOMEvent = async (mom) => {
  if (!mom?.meetingDate) return null;

  return syncSystemEvent(
    {
      workspace: mom.workspace,
      refModel: 'MOM',
      refId: mom._id,
      eventType: 'mom',
    },
    {
      title: `MOM: ${mom.title || mom.momNumber || 'Meeting Minutes'}`,
      description: mom.agenda,
      startDate: mom.meetingDate,
      endDate: mom.meetingDate,
      allDay: false,
      status: mom.status === 'signed' ? 'completed' : 'scheduled',
      assignedTo: mom.attendees?.map((attendee) => attendee.user).filter(Boolean) || [],
      project: mom.project,
      task: mom.task,
      metadata: {
        source: 'mom',
        sourceNumber: mom.momNumber,
        sourceStatus: mom.status,
        sourceUrl: `/mom/${mom._id}`,
      },
    }
  );
};

const syncSLAEvents = async (slaTracker, task) => {
  const events = [];
  for (const phase of slaTracker.phases || []) {
    if (!phase.plannedEndDate) continue;

    const isComplete = phase.status === 'completed' || phase.actualEndDate;
    const isOverdue = !isComplete && new Date(phase.plannedEndDate) < new Date();

    events.push(await syncSystemEvent(
      {
        workspace: slaTracker.workspace,
        refModel: 'SLATracker',
        refId: slaTracker._id,
        eventType: 'sla',
        'metadata.phaseKey': phase.phaseKey,
      },
      {
        title: `SLA: ${phase.phaseName} Due - ${task?.taskNumber || ''}`.trim(),
        startDate: phase.plannedEndDate,
        endDate: phase.plannedEndDate,
        allDay: true,
        status: isComplete ? 'completed' : isOverdue ? 'overdue' : 'pending',
        priority: isOverdue ? 'high' : 'medium',
        assignedTo: task?.assignedTo || [],
        project: task?.project,
        task: task?._id,
        metadata: {
          source: 'sla',
          phaseKey: phase.phaseKey,
          phaseName: phase.phaseName,
          taskNumber: task?.taskNumber,
          sourceStatus: phase.status,
          actualCompletionDate: phase.actualEndDate,
        },
      }
    ));
  }
  return events;
};

const cancelSLAEvents = async (slaTrackerId, reason) => {
  await CalendarEvent.updateMany(
    { refModel: 'SLATracker', refId: slaTrackerId, status: { $nin: ['completed', 'cancelled'] } },
    { status: 'cancelled', 'metadata.cancelledReason': reason }
  );
};

const updateSLAPhaseEvent = async (slaTracker, phase, task) => {
  if (!slaTracker?._id || !phase?.phaseKey || !phase?.plannedEndDate) return null;
  const isComplete = phase.status === 'completed' || phase.actualEndDate;
  const isOverdue = !isComplete && new Date(phase.plannedEndDate) < new Date();

  return syncSystemEvent(
    {
      workspace: slaTracker.workspace,
      refModel: 'SLATracker',
      refId: slaTracker._id,
      eventType: 'sla',
      'metadata.phaseKey': phase.phaseKey,
    },
    {
      title: `SLA: ${phase.phaseName || phase.phaseKey} Due - ${task?.taskNumber || ''}`.trim(),
      startDate: phase.plannedEndDate,
      endDate: phase.plannedEndDate,
      allDay: true,
      status: isComplete ? 'completed' : isOverdue ? 'overdue' : 'pending',
      priority: isOverdue ? 'high' : 'medium',
      assignedTo: task?.assignedTo || [],
      project: task?.project,
      task: task?._id,
      metadata: {
        source: 'sla',
        phaseKey: phase.phaseKey,
        phaseName: phase.phaseName,
        taskNumber: task?.taskNumber,
        sourceStatus: phase.status,
        actualCompletionDate: phase.actualEndDate,
      },
    }
  );
};

const syncBudgetEvent = async (budget) => {
  const targetDate = budget.reviewDate || budget.approvalDeadline || budget.closingDate || budget.endDate;
  if (!targetDate) return null;

  return syncSystemEvent(
    {
      workspace: budget.workspace,
      refModel: 'Budget',
      refId: budget._id,
      eventType: 'budget',
    },
    {
      title: `Budget Review: ${budget.title || budget.budgetNumber || 'Budget'}`,
      startDate: targetDate,
      endDate: targetDate,
      allDay: true,
      status: sourceStatusToCalendarStatus(budget.status),
      department: budget.department,
      project: budget.project,
      metadata: {
        source: 'budget',
        sourceNumber: budget.budgetNumber,
        sourceStatus: budget.status,
      },
    }
  );
};

const syncExpenseEvent = async (expense) => {
  if (!expense?.paymentDate) return null;

  return syncSystemEvent(
    {
      workspace: expense.workspace,
      refModel: 'Expense',
      refId: expense._id,
      eventType: 'expense',
    },
    {
      title: `Expense Payment: ${expense.title || expense.expenseNumber || 'Expense'} - ${expense.currency || 'INR'} ${expense.amount || 0}`,
      startDate: expense.paymentDate,
      endDate: expense.paymentDate,
      allDay: true,
      status: sourceStatusToCalendarStatus(expense.status),
      project: expense.project,
      task: expense.task,
      metadata: {
        source: 'expense',
        sourceNumber: expense.expenseNumber,
        sourceStatus: expense.status,
      },
    }
  );
};

const syncHolidayEvent = async (holiday) => {
  if (!holiday?.date) return null;

  return syncSystemEvent(
    {
      workspace: holiday.workspace,
      refModel: 'Holiday',
      refId: holiday._id,
      eventType: 'holiday',
    },
    {
      title: `Holiday: ${holiday.name}`,
      startDate: holiday.date,
      endDate: holiday.date,
      allDay: true,
      status: 'scheduled',
      metadata: {
        source: 'holiday',
        sourceStatus: holiday.type,
      },
    }
  );
};

const markEventCompleted = async (workspaceId, eventId, userId) => {
  const event = await CalendarEvent.findOneAndUpdate(
    { _id: eventId, workspace: workspaceId },
    { status: 'completed', updatedBy: userId, 'metadata.actualCompletionDate': new Date() },
    { new: true }
  );
  await writeCalendarAudit({
    workspace: workspaceId,
    user: userId,
    action: 'event_completed',
    eventId,
    description: event ? `Calendar event completed: ${event.title}` : 'Calendar event completed',
  });
  return event;
};

const markOverdueEvents = async (workspaceId) => {
  const query = {
    endDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled', 'overdue'] },
    eventType: { $ne: 'holiday' },
  };
  if (workspaceId) query.workspace = workspaceId;

  return CalendarEvent.updateMany(query, { status: 'overdue' });
};

const markTaskEventOverdue = async (task) => {
  if (!task?._id) return null;
  return CalendarEvent.findOneAndUpdate(
    { workspace: task.workspace, refModel: 'Task', refId: task._id, eventType: 'task', status: { $nin: ['completed', 'cancelled'] } },
    { status: 'overdue', priority: task.priority || 'high' },
    { new: true }
  );
};

const getNextOccurrenceDate = (current, rule) => {
  const interval = Math.max(Number(rule?.interval) || 1, 1);
  const frequency = rule?.frequency || 'weekly';
  return dayjs(current).add(interval, frequency).toDate();
};

const generateRecurringInstances = async (parentEvent, horizonDays = 90) => {
  if (!parentEvent?.isRecurring || !parentEvent?.recurrenceRule?.frequency) return [];

  const rule = parentEvent.recurrenceRule;
  const horizonEnd = dayjs().add(horizonDays, 'day').endOf('day');
  const durationMinutes = Math.max(dayjs(parentEvent.endDate || parentEvent.startDate).diff(dayjs(parentEvent.startDate), 'minute'), 0);
  const existingCount = await CalendarEvent.countDocuments({ parentEvent: parentEvent._id });
  let generated = 0;
  const maxOccurrences = Number(rule.maxOccurrences) || 24;

  const lastInstance = await CalendarEvent.findOne({ parentEvent: parentEvent._id }).sort({ startDate: -1 });
  let nextStart = lastInstance
    ? getNextOccurrenceDate(lastInstance.startDate, rule)
    : getNextOccurrenceDate(parentEvent.startDate, rule);

  while (
    dayjs(nextStart).isBefore(horizonEnd)
    && (!rule.endDate || dayjs(nextStart).isSame(dayjs(rule.endDate), 'day') || dayjs(nextStart).isBefore(dayjs(rule.endDate)))
    && existingCount + generated < maxOccurrences
  ) {
    const exists = await CalendarEvent.findOne({ parentEvent: parentEvent._id, startDate: nextStart });
    if (!exists) {
      await CalendarEvent.create({
        workspace: parentEvent.workspace,
        title: parentEvent.title,
        description: parentEvent.description,
        eventType: parentEvent.eventType,
        startDate: nextStart,
        endDate: dayjs(nextStart).add(durationMinutes, 'minute').toDate(),
        allDay: parentEvent.allDay,
        color: parentEvent.color,
        status: parentEvent.status,
        priority: parentEvent.priority,
        assignedTo: parentEvent.assignedTo,
        department: parentEvent.department,
        project: parentEvent.project,
        task: parentEvent.task,
        location: parentEvent.location,
        reminders: (parentEvent.reminders || []).map((reminder) => ({
          minutesBefore: reminder.minutesBefore,
          channel: reminder.channel,
          sent: false,
        })),
        isSystemGenerated: false,
        isEditable: true,
        isRecurring: false,
        isRecurringInstance: true,
        parentEvent: parentEvent._id,
        recurrenceIndex: existingCount + generated + 1,
        createdBy: parentEvent.createdBy,
        metadata: { ...mapToObject(parentEvent.metadata), source: 'recurring_event' },
      });
      generated += 1;
    }
    nextStart = getNextOccurrenceDate(nextStart, rule);
  }

  return CalendarEvent.find({ parentEvent: parentEvent._id }).sort({ startDate: 1 });
};

const getCalendarMetrics = async (workspaceId, filters = {}) => {
  const start = filters.start ? new Date(filters.start) : dayjs().startOf('month').toDate();
  const end = filters.end ? new Date(filters.end) : dayjs().endOf('month').toDate();
  const query = {
    workspace: workspaceId,
    isDeleted: { $ne: true },
    startDate: { $lte: end },
    endDate: { $gte: start },
  };
  if (filters.showCancelled !== 'true') query.status = { $ne: 'cancelled' };

  const events = await CalendarEvent.find(query).lean();
  const byType = {};
  const byStatus = {};
  const byDepartment = {};
  const byUser = {};
  const byDate = {};
  let overdueEvents = 0;
  let completedEvents = 0;
  let upcoming7Days = 0;
  const sevenDaysEnd = dayjs().add(7, 'day').endOf('day');

  events.forEach((event) => {
    byType[event.eventType] = (byType[event.eventType] || 0) + 1;
    byStatus[event.status] = (byStatus[event.status] || 0) + 1;
    if (event.department) byDepartment[String(event.department)] = (byDepartment[String(event.department)] || 0) + 1;
    (event.assignedTo || []).forEach((userId) => {
      byUser[String(userId)] = (byUser[String(userId)] || 0) + 1;
    });
    const dateKey = dayjs(event.startDate).format('YYYY-MM-DD');
    byDate[dateKey] = (byDate[dateKey] || 0) + 1;
    if (event.status === 'overdue') overdueEvents += 1;
    if (event.status === 'completed') completedEvents += 1;
    if (dayjs(event.startDate).isAfter(dayjs().startOf('day')) && dayjs(event.startDate).isBefore(sevenDaysEnd)) upcoming7Days += 1;
  });

  const mostOverloadedDate = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    totalEvents: events.length,
    taskEvents: byType.task || 0,
    meetingEvents: byType.meeting || 0,
    slaEvents: byType.sla || 0,
    overdueEvents,
    completedEvents,
    upcoming7Days,
    byType,
    byStatus,
    byDepartment,
    byUser,
    heatmap: byDate,
    mostOverloadedDate: mostOverloadedDate ? { date: mostOverloadedDate[0], count: mostOverloadedDate[1] } : null,
  };
};

const sendCalendarReminders = async () => {
  const now = new Date();
  const events = await CalendarEvent.find({
    status: { $nin: ['completed', 'cancelled'] },
    reminders: { $elemMatch: { sent: { $ne: true } } },
  });

  for (const event of events) {
    let changed = false;
    for (const reminder of event.reminders) {
      if (reminder.sent) continue;
      const remindAt = new Date(new Date(event.startDate).getTime() - (reminder.minutesBefore || 0) * 60000);
      if (remindAt > now) continue;

      const recipients = event.assignedTo?.length ? event.assignedTo : [event.createdBy].filter(Boolean);
      if (recipients.length) {
        await notify({
          workspace: event.workspace,
          recipients,
          type: 'calendar_reminder',
          title: `Reminder: ${event.title}`,
          message: `${event.title} starts in ${reminder.minutesBefore} minutes.`,
          refModel: 'CalendarEvent',
          refId: event._id,
          actionUrl: `/calendar`,
          channels: {
            inApp: reminder.channel === 'in_app' || reminder.channel === 'both',
            email: reminder.channel === 'email' || reminder.channel === 'both',
          },
          metadata: { eventType: event.eventType, startDate: event.startDate },
        });
      }

      reminder.sent = true;
      reminder.sentAt = now;
      changed = true;
    }
    if (changed) await event.save();
  }
};

module.exports = {
  EVENT_COLORS,
  syncTaskEvent,
  cancelTaskEvent,
  syncTrackerEvent,
  syncMeetingEvent,
  syncMOMEvent,
  syncSLAEvents,
  updateSLAPhaseEvent,
  cancelSLAEvents,
  syncBudgetEvent,
  syncExpenseEvent,
  syncHolidayEvent,
  sendCalendarReminders,
  markEventCompleted,
  markTaskEventOverdue,
  markOverdueEvents,
  generateRecurringInstances,
  getCalendarMetrics,
};
