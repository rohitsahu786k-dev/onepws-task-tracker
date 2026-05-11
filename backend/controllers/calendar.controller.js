const asyncHandler = require('../utils/asyncHandler');
const CalendarEvent = require('../models/CalendarEvent');
const { EVENT_COLORS, markEventCompleted } = require('../services/calendar.service');

const getRange = (query) => ({
  start: query.start || query.startDate,
  end: query.end || query.endDate,
});

const buildRangeQuery = (wid, query) => {
  const { start, end } = getRange(query);
  const dbQuery = { workspace: wid };

  if (query.showCancelled !== 'true') dbQuery.status = { $ne: 'cancelled' };
  if (start && end) {
    dbQuery.startDate = { $lte: new Date(end) };
    dbQuery.endDate = { $gte: new Date(start) };
  }
  if (query.type) dbQuery.eventType = query.type;
  if (query.status) dbQuery.status = query.status;
  if (query.priority) dbQuery.priority = query.priority;
  if (query.user) dbQuery.assignedTo = query.user;
  if (query.department) dbQuery.department = query.department;
  if (query.project) dbQuery.project = query.project;
  if (query.onlyOverdue === 'true') dbQuery.status = 'overdue';
  if (query.search) dbQuery.title = { $regex: query.search, $options: 'i' };

  return dbQuery;
};

const toFullCalendarEvent = (event) => {
  const color = event.color || EVENT_COLORS[event.eventType] || EVENT_COLORS.custom;
  return {
    id: event._id,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    allDay: event.allDay,
    backgroundColor: color,
    borderColor: color,
    extendedProps: {
      eventType: event.eventType,
      status: event.status,
      priority: event.priority,
      refModel: event.refModel,
      refId: event.refId,
      assignedTo: event.assignedTo,
      department: event.department,
      project: event.project,
      task: event.task,
      isSystemGenerated: event.isSystemGenerated,
      isEditable: event.isEditable,
      reminders: event.reminders,
      metadata: event.metadata,
    },
  };
};

const getEvents = asyncHandler(async (req, res) => {
  const events = await CalendarEvent.find(buildRangeQuery(req.params.wid, req.query))
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .populate('project', 'name title')
    .sort({ startDate: 1 });

  const formattedEvents = events.map(toFullCalendarEvent);
  res.json({ success: true, events: formattedEvents, data: formattedEvents });
});

const getMyCalendar = asyncHandler(async (req, res) => {
  const query = buildRangeQuery(req.params.wid, req.query);
  query.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];

  const events = await CalendarEvent.find(query).sort({ startDate: 1 });
  const formattedEvents = events.map(toFullCalendarEvent);
  res.json({ success: true, events: formattedEvents, data: formattedEvents });
});

const getTeamCalendar = asyncHandler(async (req, res) => {
  const query = buildRangeQuery(req.params.wid, req.query);
  if (req.query.department) query.department = req.query.department;

  const events = await CalendarEvent.find(query)
    .populate('assignedTo', 'name email')
    .sort({ startDate: 1 });
  const formattedEvents = events.map(toFullCalendarEvent);
  res.json({ success: true, events: formattedEvents, data: formattedEvents });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid })
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .populate('project', 'name title');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, event, data: event });
});

const createEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.create({
    ...req.body,
    workspace: req.params.wid,
    eventType: req.body.eventType || 'custom',
    color: req.body.color || EVENT_COLORS[req.body.eventType || 'custom'],
    createdBy: req.user._id,
    isSystemGenerated: false,
    isEditable: true,
  });
  res.status(201).json({ success: true, event, data: event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  if (event.isSystemGenerated && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'System events must be updated from their source module.' });
  }

  Object.assign(event, req.body);
  event.updatedBy = req.user._id;
  await event.save();
  res.json({ success: true, event, data: event });
});

const completeEvent = asyncHandler(async (req, res) => {
  const event = await markEventCompleted(req.params.wid, req.params.id, req.user._id);
  res.json({ success: true, event, data: event });
});

const cancelEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOneAndUpdate(
    { _id: req.params.id, workspace: req.params.wid },
    { status: 'cancelled', updatedBy: req.user._id, 'metadata.cancelledReason': req.body.reason },
    { new: true }
  );
  res.json({ success: true, event, data: event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  if (event.isSystemGenerated) {
    event.status = 'cancelled';
    event.updatedBy = req.user._id;
    event.metadata = { ...event.metadata, cancelledReason: 'Source-controlled event cancelled from calendar' };
    await event.save();
    return res.json({ success: true, message: 'System event cancelled', event, data: event });
  }

  await event.deleteOne();
  res.json({ success: true, message: 'Deleted' });
});

const addReminder = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  event.reminders.push({
    minutesBefore: req.body.minutesBefore,
    channel: req.body.channel || 'in_app',
    sent: false,
  });
  event.updatedBy = req.user._id;
  await event.save();
  res.status(201).json({ success: true, event, data: event });
});

const removeReminder = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  event.reminders = event.reminders.filter((reminder) => String(reminder._id) !== req.params.reminderId);
  event.updatedBy = req.user._id;
  await event.save();
  res.json({ success: true, event, data: event });
});

const checkConflict = asyncHandler(async (req, res) => {
  const { attendees = [], startDate, endDate, excludeEventId } = req.body;
  const query = {
    workspace: req.params.wid,
    status: { $nin: ['cancelled', 'completed'] },
    assignedTo: { $in: attendees },
    startDate: { $lt: new Date(endDate) },
    endDate: { $gt: new Date(startDate) },
  };
  if (excludeEventId) query._id = { $ne: excludeEventId };

  const conflicts = await CalendarEvent.find(query)
    .populate('assignedTo', 'name email')
    .select('title startDate endDate assignedTo eventType');

  res.json({ success: true, hasConflict: conflicts.length > 0, conflicts, data: { hasConflict: conflicts.length > 0, conflicts } });
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
};
