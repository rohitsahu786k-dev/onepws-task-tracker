const Meeting = require('../models/Meeting');
const MOM = require('../models/MOM');

async function getMeetingReport(workspaceId, filters = {}) {
  const query = { workspace: workspaceId };
  if (filters.status) query.status = filters.status;
  if (filters.meetingType) query.meetingType = filters.meetingType;
  if (filters.dateFrom || filters.dateTo) {
    query.startDateTime = {};
    if (filters.dateFrom) query.startDateTime.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.startDateTime.$lte = new Date(filters.dateTo);
  }

  const meetings = await Meeting.find(query)
    .populate('createdBy', 'name email')
    .populate('project', 'title name')
    .populate('task', 'taskNumber title')
    .populate('mom', 'status momNumber')
    .sort({ startDateTime: -1 })
    .lean();

  const rows = meetings.map((meeting) => ({
    meetingNumber: meeting.meetingNumber,
    title: meeting.title,
    meetingType: meeting.meetingType,
    meetingMode: meeting.meetingMode,
    organizer: meeting.createdBy?.name,
    attendeesCount: (meeting.attendees?.length || 0) + (meeting.externalAttendees?.length || 0),
    startDateTime: meeting.startDateTime,
    durationMinutes: meeting.durationMinutes,
    status: meeting.status,
    project: meeting.project?.title || meeting.project?.name,
    task: meeting.task?.taskNumber,
    momCreated: Boolean(meeting.mom),
    momSigned: meeting.mom?.status === 'signed',
    cancellationReason: meeting.cancellationReason
  }));

  const metrics = {
    total: rows.length,
    upcoming: rows.filter((row) => ['scheduled', 'rescheduled'].includes(row.status) && new Date(row.startDateTime) >= new Date()).length,
    completed: rows.filter((row) => row.status === 'completed').length,
    cancelled: rows.filter((row) => row.status === 'cancelled').length,
    withoutMOM: rows.filter((row) => row.status === 'completed' && !row.momCreated).length,
    kickoffCompleted: rows.filter((row) => row.meetingType === 'kickoff' && row.status === 'completed').length,
    averageDuration: rows.length
      ? Math.round(rows.reduce((sum, row) => sum + (row.durationMinutes || 0), 0) / rows.length)
      : 0
  };

  return { rows, metrics };
}

module.exports = { getMeetingReport };
