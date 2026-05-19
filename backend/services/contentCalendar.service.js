const CalendarEvent = require('../models/CalendarEvent');

function buildPublishDateTime(scheduledDate, scheduledTime) {
  if (!scheduledDate) return null;
  const date = new Date(scheduledDate);
  if (scheduledTime) {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    if (!Number.isNaN(hours)) date.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
  }
  return date;
}

async function createCalendarEvent(contentItem) {
  if (!CalendarEvent) return null;
  const startDate = contentItem.publishDateTime || contentItem.scheduledDate;
  const eventStatus = ['published', 'archived'].includes(contentItem.status)
    ? 'completed'
    : contentItem.status === 'cancelled'
      ? 'cancelled'
      : contentItem.status === 'scheduled'
        ? 'scheduled'
        : 'pending';
  const event = await CalendarEvent.create({
    workspace: contentItem.workspace,
    title: `Content: ${contentItem.title}`,
    eventType: 'content',
    startDate,
    endDate: startDate,
    allDay: !contentItem.scheduledTime,
    status: eventStatus,
    priority: contentItem.priority,
    assignedTo: contentItem.assignedTo,
    project: contentItem.project,
    task: contentItem.task,
    refModel: 'ContentItem',
    refId: contentItem._id,
    isSystemGenerated: true,
    isEditable: false,
    metadata: {
      campaign: contentItem.campaign,
      contentNumber: contentItem.contentNumber,
      contentType: contentItem.contentType,
      platforms: contentItem.platforms,
      sourceStatus: contentItem.status
    }
  }).catch(() => null);

  if (event) {
    contentItem.calendarEvent = event._id;
    await contentItem.save();
  }
  return event;
}

async function updateCalendarEvent(contentItem) {
  if (!contentItem.calendarEvent) return createCalendarEvent(contentItem);
  const startDate = contentItem.publishDateTime || contentItem.scheduledDate;
  const eventStatus = ['published', 'archived'].includes(contentItem.status)
    ? 'completed'
    : contentItem.status === 'cancelled'
      ? 'cancelled'
      : contentItem.status === 'scheduled'
        ? 'scheduled'
        : 'pending';
  return CalendarEvent.findOneAndUpdate(
    { _id: contentItem.calendarEvent, workspace: contentItem.workspace },
    {
      title: `Content: ${contentItem.title}`,
      startDate,
      endDate: startDate,
      allDay: !contentItem.scheduledTime,
      status: eventStatus,
      priority: contentItem.priority,
      assignedTo: contentItem.assignedTo,
      metadata: {
        campaign: contentItem.campaign,
        contentNumber: contentItem.contentNumber,
        contentType: contentItem.contentType,
        platforms: contentItem.platforms,
        sourceStatus: contentItem.status
      }
    },
    { new: true, upsert: false }
  ).catch(() => null);
}

module.exports = { buildPublishDateTime, createCalendarEvent, updateCalendarEvent };
