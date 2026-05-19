const CalendarEvent = require('../models/CalendarEvent');

function mapStatus(status) {
  if (['completed', 'closed', 'signed'].includes(status)) return 'completed';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'overdue') return 'overdue';
  if (status === 'in_progress') return 'in_progress';
  return 'pending';
}

async function syncPointCalendarEvent(mom, point) {
  if (!point?.targetDate) return null;
  const event = await CalendarEvent.findOneAndUpdate(
    {
      workspace: mom.workspace,
      refModel: 'MOM',
      refId: mom._id,
      eventType: 'mom',
      'metadata.pointId': String(point._id),
    },
    {
      title: `MOM Point Due: ${point.title}`,
      startDate: point.targetDate,
      endDate: point.targetDate,
      allDay: true,
      status: mapStatus(point.status),
      priority: point.priority || 'medium',
      assignedTo: point.responsiblePerson ? [point.responsiblePerson] : [],
      project: mom.project,
      task: point.linkedTask,
      isSystemGenerated: true,
      isEditable: false,
      metadata: {
        source: 'mom',
        pointId: String(point._id),
        momNumber: mom.momNumber,
        pointNumber: String(point.pointNumber || ''),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  point.calendarEvent = event._id;
  return event;
}

async function syncAllPointEvents(mom) {
  const events = [];
  for (const point of mom.actionPoints || []) {
    const event = await syncPointCalendarEvent(mom, point);
    if (event) events.push(event);
  }
  return events;
}

module.exports = { syncPointCalendarEvent, syncAllPointEvents };
