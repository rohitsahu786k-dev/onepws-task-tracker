const Meeting = require('../models/Meeting');

async function checkMeetingConflicts({ workspace, attendees = [], startDateTime, endDateTime, excludeMeeting }) {
  const userIds = attendees
    .map((attendee) => attendee.user || attendee)
    .filter(Boolean);

  if (!userIds.length || !startDateTime || !endDateTime) {
    return { hasConflict: false, conflicts: [] };
  }

  const query = {
    workspace,
    status: { $in: ['scheduled', 'rescheduled'] },
    'attendees.user': { $in: userIds },
    startDateTime: { $lt: new Date(endDateTime) },
    endDateTime: { $gt: new Date(startDateTime) }
  };
  if (excludeMeeting) query._id = { $ne: excludeMeeting };

  const meetings = await Meeting.find(query)
    .select('title meetingNumber startDateTime endDateTime attendees')
    .populate('attendees.user', 'name email')
    .lean();

  const conflicts = meetings.flatMap((meeting) =>
    meeting.attendees
      .filter((attendee) => attendee.user && userIds.map(String).includes(String(attendee.user._id)))
      .map((attendee) => ({
        user: attendee.user.name,
        userId: attendee.user._id,
        meetingTitle: meeting.title,
        meetingNumber: meeting.meetingNumber,
        startDateTime: meeting.startDateTime,
        endDateTime: meeting.endDateTime
      }))
  );

  return { hasConflict: conflicts.length > 0, conflicts };
}

module.exports = { checkMeetingConflicts };
