/**
 * calendar.controller.enhanced.js - Complete Event Creation Logic
 * Handles: Create, Update, Delete calendar events with recurrence & reminders
 */

const asyncHandler = require('../utils/asyncHandler');
const CalendarEvent = require('../models/CalendarEvent');
const Reminder = require('../models/Reminder');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notification.service');

/**
 * CREATE CALENDAR EVENT
 * POST /api/workspaces/:wid/calendar/events
 * 
 * Body: {
 *   title, type, startDate, endDate, allDay,
 *   description, attendees, color, reminderMinutes,
 *   refId, refModel (optional - link to Task/Meeting/etc),
 *   isRecurring, recurrenceRule (daily/weekly/monthly)
 * }
 */
const createCalendarEvent = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const {
    title,
    type,
    startDate,
    endDate,
    allDay = false,
    description,
    attendees = [],
    color = '#3788d8',
    reminderMinutes,
    refId,
    refModel,
    isRecurring = false,
    recurrenceRule
  } = req.body;

  // 1. VALIDATION
  if (!title || !startDate) {
    throw new ApiError(400, 'Title and start date required');
  }

  // 2. PARSE dates
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;

  if (end < start) {
    throw new ApiError(400, 'End date must be after start date');
  }

  // 3. CREATE main event
  const eventData = {
    workspace: wid,
    title,
    type: type || 'Custom',
    startDate: start,
    endDate: end,
    allDay,
    description,
    attendees,
    color,
    createdBy: req.user._id,
    isRecurring: isRecurring && !!recurrenceRule,
    recurrenceRule: isRecurring ? recurrenceRule : null
  };

  // Link to task/meeting if provided
  if (refId && refModel) {
    eventData.refId = refId;
    eventData.refModel = refModel;
  }

  const event = await CalendarEvent.create(eventData);

  // 4. CREATE recurring events if enabled
  if (isRecurring && recurrenceRule) {
    await createRecurringEvents(event, recurrenceRule);
  }

  // 5. CREATE reminder if specified
  if (reminderMinutes) {
    const reminderTime = new Date(start.getTime() - reminderMinutes * 60000);

    await Reminder.create({
      workspace: wid,
      event: event._id,
      reminderTime,
      type: 'calendar_event',
      status: 'pending',
      recipients: attendees.length > 0 ? attendees : [req.user._id]
    });
  }

  // 6. SEND NOTIFICATIONS to attendees
  if (attendees.length > 0) {
    for (const userId of attendees) {
      const notification = await Notification.create({
        workspace: wid,
        user: userId,
        type: 'calendar_event_created',
        title: `New Event: ${title}`,
        message: `${req.user.name} invited you to "${title}"`,
        refId: event._id,
        refModel: 'CalendarEvent'
      });

      await notificationService.notifyUser(userId, notification);
    }
  }

  // 7. ACTIVITY LOG
  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'calendar_event_created',
    refId: event._id,
    refModel: 'CalendarEvent',
    meta: {
      title,
      type,
      attendeeCount: attendees.length,
      isRecurring
    }
  });

  const populatedEvent = await CalendarEvent.findById(event._id)
    .populate('attendees', 'name email avatar')
    .populate('createdBy', 'name')
    .lean();

  return res.status(201).json(
    new ApiResponse(201, populatedEvent, 'Event created successfully')
  );
});

/**
 * Helper: Create recurring events
 */
const createRecurringEvents = async (parentEvent, recurrenceRule) => {
  const instances = generateRecurrenceInstances(parentEvent.startDate, recurrenceRule, 12);

  const recurringEvents = instances.map((instanceDate, idx) => ({
    workspace: parentEvent.workspace,
    title: parentEvent.title,
    type: parentEvent.type,
    startDate: instanceDate,
    endDate: new Date(instanceDate.getTime() + (parentEvent.endDate - parentEvent.startDate)),
    allDay: parentEvent.allDay,
    description: parentEvent.description,
    attendees: parentEvent.attendees,
    color: parentEvent.color,
    createdBy: parentEvent.createdBy,
    parentEventId: parentEvent._id,
    isRecurringInstance: true,
    recurrenceIndex: idx
  }));

  await CalendarEvent.insertMany(recurringEvents);
};

/**
 * Generate recurrence instances (next 12 occurrences)
 */
const generateRecurrenceInstances = (startDate, rule, count) => {
  const instances = [];
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    instances.push(new Date(current));

    // Increment based on rule
    if (rule === 'daily') {
      current.setDate(current.getDate() + 1);
    } else if (rule === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (rule === 'monthly') {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return instances;
};

/**
 * GET CALENDAR EVENTS with filters
 * GET /api/workspaces/:wid/calendar/events?startDate=&endDate=&type=
 */
const getCalendarEvents = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { startDate, endDate, type } = req.query;

  const filter = { workspace: wid };

  // Filter by date range
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  // Filter by type
  if (type) filter.type = type;

  const events = await CalendarEvent.find(filter)
    .populate('attendees', 'name email avatar')
    .populate('createdBy', 'name')
    .sort({ startDate: 1 })
    .lean();

  return res.json(new ApiResponse(200, events));
});

/**
 * UPDATE CALENDAR EVENT
 * PUT /api/workspaces/:wid/calendar/events/:eventId
 */
const updateCalendarEvent = asyncHandler(async (req, res) => {
  const { wid, eventId } = req.params;
  const updateData = req.body;

  const event = await CalendarEvent.findByIdAndUpdate(
    eventId,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  )
    .populate('attendees', 'name email avatar')
    .lean();

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Activity log
  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'calendar_event_updated',
    refId: event._id,
    refModel: 'CalendarEvent'
  });

  return res.json(new ApiResponse(200, event, 'Event updated'));
});

/**
 * DELETE CALENDAR EVENT
 * DELETE /api/workspaces/:wid/calendar/events/:eventId
 */
const deleteCalendarEvent = asyncHandler(async (req, res) => {
  const { wid, eventId } = req.params;
  const { deleteRecurring = false } = req.body;

  const event = await CalendarEvent.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Delete recurring instances if parent is deleted
  if (deleteRecurring && !event.parentEventId) {
    await CalendarEvent.deleteMany({ parentEventId: eventId });
  }

  await CalendarEvent.findByIdAndDelete(eventId);

  // Delete associated reminders
  await Reminder.deleteMany({ event: eventId });

  // Activity log
  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'calendar_event_deleted',
    meta: { title: event.title, recurringDeleted: deleteRecurring }
  });

  return res.json(new ApiResponse(200, null, 'Event deleted'));
});

module.exports = {
  createCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent
};
