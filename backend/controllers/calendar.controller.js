const asyncHandler = require('../utils/asyncHandler');
const CalendarEvent = require('../models/CalendarEvent');
const Reminder = require('../models/Reminder');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const {
  EVENT_COLORS,
  markEventCompleted,
  generateRecurringInstances,
  getCalendarMetrics,
} = require('../services/calendar.service');
const { notify } = require('../services/notification.service');
const { writeCalendarAudit } = require('../services/calendarAudit.service');

const getRange = (query) => ({
  start: query.start || query.startDate,
  end: query.end || query.endDate,
});

const actorRole = (req) => req.workspaceRole || req.user?.role;
const isAdmin = (req) => ['admin', 'super_admin', 'owner'].includes(actorRole(req));

const buildRangeQuery = (wid, query = {}) => {
  const { start, end } = getRange(query);
  const dbQuery = { workspace: wid, isDeleted: { $ne: true } };

  if (query.showCancelled !== 'true') dbQuery.status = { $ne: 'cancelled' };
  if (start && end) {
    dbQuery.startDate = { $lte: new Date(end) };
    dbQuery.endDate = { $gte: new Date(start) };
  } else if (start) {
    dbQuery.endDate = { $gte: new Date(start) };
  } else if (end) {
    dbQuery.startDate = { $lte: new Date(end) };
  }
  if (query.type) dbQuery.eventType = query.type;
  if (query.eventType) dbQuery.eventType = query.eventType;
  if (query.status) dbQuery.status = query.status;
  if (query.priority) dbQuery.priority = query.priority;
  if (query.user) dbQuery.assignedTo = query.user;
  if (query.department) dbQuery.department = query.department;
  if (query.project) dbQuery.project = query.project;
  if (query.onlyOverdue === 'true') dbQuery.status = 'overdue';
  if (query.onlyMy === 'true' && query.currentUser) {
    dbQuery.$or = [{ assignedTo: query.currentUser }, { createdBy: query.currentUser }];
  }
  if (query.search) {
    const search = new RegExp(query.search, 'i');
    dbQuery.$or = [
      ...(dbQuery.$or || []),
      { title: search },
      { description: search },
      { 'metadata.sourceNumber': search },
      { 'metadata.taskNumber': search },
      { 'metadata.phaseName': search },
    ];
  }

  return dbQuery;
};

const toFullCalendarEvent = (event) => {
  const raw = event.toObject?.() || event;
  const color = raw.color || EVENT_COLORS[raw.eventType] || EVENT_COLORS.custom;
  return {
    id: raw._id,
    title: raw.title,
    start: raw.startDate,
    end: raw.endDate,
    allDay: raw.allDay,
    backgroundColor: color,
    borderColor: color,
    editable: raw.isEditable === true && raw.isSystemGenerated !== true,
    extendedProps: {
      eventType: raw.eventType,
      status: raw.status,
      priority: raw.priority,
      description: raw.description,
      refModel: raw.refModel,
      refId: raw.refId,
      assignedTo: raw.assignedTo,
      department: raw.department,
      project: raw.project,
      task: raw.task,
      location: raw.location,
      isSystemGenerated: raw.isSystemGenerated,
      isEditable: raw.isEditable,
      isRecurring: raw.isRecurring,
      parentEvent: raw.parentEvent,
      reminders: raw.reminders,
      metadata: raw.metadata,
      createdBy: raw.createdBy,
    },
  };
};

const populateEvent = (query) => query
  .populate('assignedTo', 'name email designation')
  .populate('department', 'name')
  .populate('project', 'name title projectCode')
  .populate('task', 'taskNumber title status')
  .populate('createdBy', 'name email');

const validateEventPayload = (payload) => {
  if (!payload.title?.trim()) throw new Error('Event title is required');
  if (!payload.startDate) throw new Error('Start date is required');
  const start = new Date(payload.startDate);
  const end = payload.endDate ? new Date(payload.endDate) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('Valid event dates are required');
  if (end < start) throw new Error('End date must be after start date');
};

const createReminderDocs = async ({ workspace, event, reminders, user }) => {
  if (!Array.isArray(reminders) || !reminders.length) return [];
  return Reminder.insertMany(reminders.map((reminder) => ({
    workspace,
    event: event._id,
    user: reminder.user,
    minutesBefore: reminder.minutesBefore,
    channel: reminder.channel || 'in_app',
    sent: false,
    createdBy: user,
  })));
};

const notifyAssignees = async ({ event, sender, type, title, message, email = false }) => {
  const recipients = (event.assignedTo || []).map(String);
  if (!recipients.length) return [];
  return notify({
    workspace: event.workspace,
    sender,
    recipients,
    type,
    title,
    message,
    refModel: 'CalendarEvent',
    refId: event._id,
    actionUrl: '/calendar',
    channels: { inApp: true, email },
    metadata: { eventTitle: event.title, eventType: event.eventType, startDate: event.startDate },
  });
};

const getEvents = asyncHandler(async (req, res) => {
  const query = buildRangeQuery(req.params.wid, { ...req.query, currentUser: req.user._id });

  const applyAccessOr = (accessOr) => {
    if (query.$or?.length) {
      query.$and = [...(query.$and || []), { $or: query.$or }, { $or: accessOr }];
      delete query.$or;
    } else {
      query.$or = accessOr;
    }
  };

  if (actorRole(req) === 'member') {
    applyAccessOr([
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ]);
  } else if (actorRole(req) === 'manager' && req.workspaceDepartment && !req.query.department) {
    applyAccessOr([
      { department: req.workspaceDepartment },
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ]);
  }

  const events = await populateEvent(CalendarEvent.find(query)).sort({ startDate: 1 });
  const formattedEvents = events.map(toFullCalendarEvent);
  res.json({ success: true, events: formattedEvents, rawEvents: events, data: formattedEvents });
});

const getMyCalendar = asyncHandler(async (req, res) => {
  const query = buildRangeQuery(req.params.wid, req.query);
  query.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];

  const events = await populateEvent(CalendarEvent.find(query)).sort({ startDate: 1 });
  const formattedEvents = events.map(toFullCalendarEvent);
  res.json({ success: true, events: formattedEvents, rawEvents: events, data: formattedEvents });
});

const getTeamCalendar = asyncHandler(async (req, res) => {
  const query = buildRangeQuery(req.params.wid, req.query);
  if (req.query.department) query.department = req.query.department;

  const events = await populateEvent(CalendarEvent.find(query)).sort({ startDate: 1 });
  const formattedEvents = events.map(toFullCalendarEvent);
  res.json({ success: true, events: formattedEvents, rawEvents: events, data: formattedEvents });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await populateEvent(CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid, isDeleted: { $ne: true } }));
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, event, data: event });
});

const createEvent = asyncHandler(async (req, res) => {
  try {
    validateEventPayload(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const payload = {
    ...req.body,
    workspace: req.params.wid,
    eventType: req.body.eventType || 'custom',
    color: req.body.color || EVENT_COLORS[req.body.eventType || 'custom'],
    endDate: req.body.endDate || req.body.startDate,
    assignedTo: req.body.assignedTo || req.body.attendees || [],
    reminders: req.body.reminders || [],
    isSystemGenerated: false,
    isEditable: true,
    createdBy: req.user._id,
  };

  if (payload.eventType === 'holiday' && !isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Only admins can create holiday events.' });
  }

  const event = await CalendarEvent.create(payload);
  await createReminderDocs({ workspace: req.params.wid, event, reminders: payload.reminders, user: req.user._id });
  if (event.isRecurring) await generateRecurringInstances(event);

  await notifyAssignees({
    event,
    sender: req.user._id,
    type: 'calendar_event_created',
    title: `New Event: ${event.title}`,
    message: `${event.title} has been added to your calendar.`,
    email: req.body.emailAttendees === true,
  });
  await writeCalendarAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'event_created',
    eventId: event._id,
    description: `Calendar event created: ${event.title}`,
    newValue: payload,
  });

  res.status(201).json({ success: true, event, data: event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid, isDeleted: { $ne: true } });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  if (event.isSystemGenerated && !isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'System events must be updated from their source module.' });
  }
  if (event.eventType === 'holiday' && !isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Only admins can update holidays.' });
  }
  if (!event.isSystemGenerated && String(event.createdBy || '') !== String(req.user._id) && !isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Only creator or admin can edit this event.' });
  }

  const updatePayload = { ...req.body };
  if (updatePayload.startDate || updatePayload.endDate) {
    try {
      validateEventPayload({
        title: updatePayload.title || event.title,
        startDate: updatePayload.startDate || event.startDate,
        endDate: updatePayload.endDate || event.endDate,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    updatePayload.reminders = (updatePayload.reminders || event.reminders || []).map((reminder) => ({
      minutesBefore: reminder.minutesBefore,
      channel: reminder.channel || 'in_app',
      sent: false,
    }));
  }

  const oldValue = event.toObject();
  Object.assign(event, updatePayload, {
    updatedBy: req.user._id,
    color: updatePayload.color || event.color || EVENT_COLORS[updatePayload.eventType || event.eventType],
  });
  await event.save();

  if (event.isRecurring && req.body.rebuildRecurring === true) {
    await CalendarEvent.updateMany({ parentEvent: event._id, status: { $nin: ['completed', 'cancelled'] } }, { status: 'cancelled', 'metadata.cancelledReason': 'Recurring parent rebuilt' });
    await generateRecurringInstances(event);
  }

  await notifyAssignees({
    event,
    sender: req.user._id,
    type: 'calendar_event_updated',
    title: `Updated Event: ${event.title}`,
    message: `${event.title} has been updated.`,
  });
  await writeCalendarAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: req.body.dragged ? 'event_dragged' : 'event_updated',
    eventId: event._id,
    description: `Calendar event updated: ${event.title}`,
    oldValue,
    newValue: event.toObject(),
  });

  res.json({ success: true, event, data: event });
});

const completeEvent = asyncHandler(async (req, res) => {
  const event = await markEventCompleted(req.params.wid, req.params.id, req.user._id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, event, data: event });
});

const cancelEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOneAndUpdate(
    { _id: req.params.id, workspace: req.params.wid },
    { status: 'cancelled', updatedBy: req.user._id, 'metadata.cancelledReason': req.body.reason || 'Cancelled from calendar' },
    { new: true }
  );
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  await notifyAssignees({
    event,
    sender: req.user._id,
    type: 'calendar_event_cancelled',
    title: `Cancelled Event: ${event.title}`,
    message: `${event.title} has been cancelled.`,
  });
  await writeCalendarAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'event_cancelled',
    eventId: event._id,
    description: `Calendar event cancelled: ${event.title}`,
    newValue: { reason: req.body.reason },
  });
  res.json({ success: true, event, data: event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid, isDeleted: { $ne: true } });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  if (event.isSystemGenerated || event.eventType === 'holiday') {
    event.status = 'cancelled';
    event.updatedBy = req.user._id;
    event.metadata = { ...event.metadata, cancelledReason: req.body?.reason || 'Source-controlled event cancelled from calendar' };
    await event.save();
    return res.json({ success: true, message: 'System event cancelled', event, data: event });
  }

  if (String(event.createdBy || '') !== String(req.user._id) && !isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Only creator or admin can delete this event.' });
  }

  event.isDeleted = true;
  event.deletedAt = new Date();
  event.deletedBy = req.user._id;
  event.status = 'cancelled';
  await event.save();
  await Reminder.deleteMany({ event: event._id });
  await writeCalendarAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'event_deleted',
    eventId: event._id,
    description: `Calendar event deleted: ${event.title}`,
  });
  res.json({ success: true, message: 'Deleted', event, data: event });
});

const addReminder = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid, isDeleted: { $ne: true } });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const reminder = {
    minutesBefore: Number(req.body.minutesBefore),
    channel: req.body.channel || 'in_app',
    sent: false,
  };
  if (!Number.isFinite(reminder.minutesBefore) || reminder.minutesBefore < 0) {
    return res.status(400).json({ success: false, message: 'minutesBefore must be a valid number.' });
  }

  event.reminders.push(reminder);
  event.updatedBy = req.user._id;
  await event.save();
  await createReminderDocs({ workspace: req.params.wid, event, reminders: [reminder], user: req.user._id });
  await writeCalendarAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'reminder_added',
    eventId: event._id,
    description: `Reminder added to ${event.title}`,
    newValue: reminder,
  });
  res.status(201).json({ success: true, event, data: event });
});

const removeReminder = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid, isDeleted: { $ne: true } });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  event.reminders = event.reminders.filter((reminder) => String(reminder._id) !== req.params.reminderId);
  event.updatedBy = req.user._id;
  await event.save();
  await Reminder.deleteOne({ event: event._id, _id: req.params.reminderId });
  await writeCalendarAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'reminder_removed',
    eventId: event._id,
    description: `Reminder removed from ${event.title}`,
  });
  res.json({ success: true, event, data: event });
});

const checkConflict = asyncHandler(async (req, res) => {
  const { attendees = [], startDate, endDate, excludeEventId } = req.body;
  if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'startDate and endDate are required.' });

  const attendeeIds = attendees.map((item) => item.user || item).filter(Boolean);
  const query = {
    workspace: req.params.wid,
    status: { $nin: ['cancelled', 'completed'] },
    assignedTo: { $in: attendeeIds },
    startDate: { $lt: new Date(endDate) },
    endDate: { $gt: new Date(startDate) },
    isDeleted: { $ne: true },
  };
  if (excludeEventId) query._id = { $ne: excludeEventId };

  const conflicts = await CalendarEvent.find(query)
    .populate('assignedTo', 'name email')
    .select('title startDate endDate assignedTo eventType status priority');

  res.json({ success: true, hasConflict: conflicts.length > 0, conflicts, data: { hasConflict: conflicts.length > 0, conflicts } });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await getCalendarMetrics(req.params.wid, req.query);
  res.json({ success: true, summary, data: summary });
});

const exportExcel = asyncHandler(async (req, res) => {
  const query = buildRangeQuery(req.params.wid, req.body?.filters || req.query);
  const events = await populateEvent(CalendarEvent.find(query)).sort({ startDate: 1 }).lean();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Calendar Events');
  sheet.columns = [
    { header: 'Title', key: 'title', width: 36 },
    { header: 'Type', key: 'eventType', width: 16 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Priority', key: 'priority', width: 14 },
    { header: 'Start', key: 'startDate', width: 22 },
    { header: 'End', key: 'endDate', width: 22 },
    { header: 'Source', key: 'source', width: 20 },
    { header: 'Department', key: 'department', width: 22 },
  ];
  sheet.getRow(1).font = { bold: true };
  events.forEach((event) => sheet.addRow({
    title: event.title,
    eventType: event.eventType,
    status: event.status,
    priority: event.priority,
    startDate: event.startDate,
    endDate: event.endDate,
    source: event.metadata?.sourceNumber || event.metadata?.taskNumber || event.refModel || 'Manual',
    department: event.department?.name || '',
  }));
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="calendar-events.xlsx"');
  res.send(buffer);
});

const exportPdf = asyncHandler(async (req, res) => {
  const summary = await getCalendarMetrics(req.params.wid, req.body?.filters || req.query);
  const doc = new PDFDocument({ margin: 48 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text('ONEPWS Calendar Report');
  doc.moveDown(0.5).fontSize(10).fillColor('#475569').text(`Generated at: ${new Date().toLocaleString()}`);
  doc.moveDown().fillColor('#111827').fontSize(11);
  Object.entries(summary)
    .filter(([, value]) => typeof value !== 'object')
    .forEach(([key, value]) => doc.text(`${key}: ${value}`));
  doc.end();
  const buffer = await finished;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="calendar-report.pdf"');
  res.send(buffer);
});

module.exports = {
  getEvents,
  getMyCalendar,
  getTeamCalendar,
  getEventById,
  createEvent,
  updateEvent,
  completeEvent,
  cancelEvent,
  deleteEvent,
  addReminder,
  removeReminder,
  checkConflict,
  getSummary,
  exportExcel,
  exportPdf,
};
