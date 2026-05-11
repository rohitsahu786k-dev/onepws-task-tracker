const dayjs = require('dayjs');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const MOM = require('../models/MOM');
const ActivityLog = require('../models/ActivityLog');
const { generateMeetingNumber } = require('./meetingNumber.service');
const { checkMeetingConflicts } = require('./meetingConflict.service');
const { syncMeetingEvent } = require('./calendar.service');
const { notify } = require('./notification.service');
const meetingEmailService = require('./meetingEmail.service');
const zoomService = require('./zoom.service');
const googleMeetService = require('./googleMeet.service');

function defaultReminders(reminders) {
  return reminders?.length ? reminders : [
    { minutesBefore: 1440, channel: 'both', sent: false },
    { minutesBefore: 30, channel: 'both', sent: false }
  ];
}

function validateMeetingPayload(payload) {
  if (!payload.title) throw new Error('Meeting title is required');
  if (!payload.startDateTime || !payload.endDateTime) throw new Error('Start and end date/time are required');
  if (new Date(payload.endDateTime) <= new Date(payload.startDateTime)) throw new Error('End date/time must be after start date/time');
  if (payload.meetingMode === 'physical' && !payload.location) throw new Error('Location is required for physical meetings');
  if (payload.meetingMode === 'manual_link' && !payload.manualMeetingLink) throw new Error('Manual meeting link is required');
}

async function resolveAttendees(attendees = []) {
  return Promise.all(attendees.map(async (attendee) => {
    if (!attendee.user) {
      return {
        name: attendee.name,
        email: attendee.email,
        department: attendee.department,
        designation: attendee.designation,
        attendeeType: attendee.attendeeType || 'internal',
        responseStatus: attendee.responseStatus || 'pending'
      };
    }
    const user = await User.findById(attendee.user).select('name email designation department');
    if (!user) return null;
    return {
      user: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      designation: user.designation,
      attendeeType: 'internal',
      responseStatus: attendee.responseStatus || 'pending'
    };
  })).then((items) => items.filter(Boolean));
}

async function logMeetingAction({ workspace, user, action, meeting, description, oldValue, newValue }) {
  return ActivityLog.create({
    workspace,
    user,
    module: 'meetings',
    action,
    refModel: 'Meeting',
    refId: meeting._id,
    description,
    oldValue,
    newValue
  });
}

async function notifyAttendees({ meeting, type, title, message, email = false }) {
  const recipients = meeting.attendees?.map((attendee) => attendee.user).filter(Boolean) || [];
  if (!recipients.length) return [];
  return notify({
    workspace: meeting.workspace,
    recipients,
    type,
    title,
    message,
    refModel: 'Meeting',
    refId: meeting._id,
    actionUrl: `/meetings/${meeting._id}`,
    channels: { inApp: true, email },
    metadata: {
      meetingTitle: meeting.title,
      meetingNumber: meeting.meetingNumber,
      meetingDate: meeting.startDateTime,
      meetingLink: meetingEmailService.getMeetingLink(meeting)
    }
  });
}

async function createMeeting({ workspace, payload, user }) {
  validateMeetingPayload(payload);
  const attendees = await resolveAttendees(payload.attendees || []);
  if (!attendees.length && !(payload.externalAttendees || []).length) throw new Error('At least one attendee is required');

  const conflictResult = await checkMeetingConflicts({
    workspace,
    attendees,
    startDateTime: payload.startDateTime,
    endDateTime: payload.endDateTime
  });
  if (conflictResult.hasConflict && !payload.allowConflicts) {
    const error = new Error('Meeting attendee conflict detected');
    error.statusCode = 409;
    error.conflicts = conflictResult.conflicts;
    throw error;
  }

  const meeting = await Meeting.create({
    workspace,
    meetingNumber: await generateMeetingNumber(workspace),
    title: payload.title,
    description: payload.description,
    agenda: payload.agenda,
    meetingType: payload.meetingType || 'general',
    meetingMode: payload.meetingMode || 'physical',
    project: payload.project,
    task: payload.task,
    intakeForm: payload.intakeForm,
    slaTracker: payload.slaTracker,
    budget: payload.budget,
    startDateTime: payload.startDateTime,
    endDateTime: payload.endDateTime,
    durationMinutes: dayjs(payload.endDateTime).diff(dayjs(payload.startDateTime), 'minute'),
    timezone: payload.timezone || 'Asia/Kolkata',
    location: payload.location,
    manualMeetingLink: payload.manualMeetingLink,
    attendees,
    externalAttendees: payload.externalAttendees || [],
    reminders: defaultReminders(payload.reminders),
    attachments: payload.attachments || [],
    createdBy: user._id
  });

  if (payload.addZoomLink) {
    meeting.onlineMeeting = await zoomService.createZoomMeeting({ workspace, meeting });
    meeting.meetingMode = 'zoom';
  } else if (payload.addGoogleMeetLink) {
    meeting.onlineMeeting = await googleMeetService.createGoogleMeet({ workspace, meeting });
    meeting.meetingMode = 'google_meet';
  } else if (meeting.meetingMode === 'manual_link') {
    meeting.onlineMeeting = { provider: 'manual', joinUrl: meeting.manualMeetingLink };
  }

  const event = await syncMeetingEvent(meeting);
  meeting.calendarEvent = event?._id;
  await meeting.save();

  await notifyAttendees({ meeting, type: 'meeting_scheduled', title: 'Meeting Scheduled', message: `You have been invited to ${meeting.title}`, email: true });
  meetingEmailService.sendMeetingInvite(meeting).catch(console.error);
  await logMeetingAction({ workspace, user: user._id, action: 'meeting_created', meeting, description: `Meeting created: ${meeting.title}` });

  return meeting;
}

async function updateMeeting({ workspace, meetingId, payload, user }) {
  const meeting = await Meeting.findOne({ _id: meetingId, workspace });
  if (!meeting) return null;
  const oldValue = { startDateTime: meeting.startDateTime, endDateTime: meeting.endDateTime, status: meeting.status };
  const previousStart = meeting.startDateTime?.toISOString();
  const previousEnd = meeting.endDateTime?.toISOString();

  if (payload.attendees) payload.attendees = await resolveAttendees(payload.attendees);
  Object.assign(meeting, payload, {
    updatedBy: user._id,
    durationMinutes: payload.startDateTime || payload.endDateTime
      ? dayjs(payload.endDateTime || meeting.endDateTime).diff(dayjs(payload.startDateTime || meeting.startDateTime), 'minute')
      : meeting.durationMinutes
  });

  if (payload.startDateTime || payload.endDateTime) {
    meeting.status = 'rescheduled';
    meeting.reminders = (meeting.reminders || []).map((reminder) => ({ ...reminder.toObject?.() || reminder, sent: false, sentAt: undefined }));
  }

  await meeting.save();
  const event = await syncMeetingEvent(meeting);
  meeting.calendarEvent = event?._id || meeting.calendarEvent;
  await meeting.save();

  const action = previousStart !== meeting.startDateTime?.toISOString() || previousEnd !== meeting.endDateTime?.toISOString()
    ? 'meeting_rescheduled'
    : 'meeting_updated';
  await notifyAttendees({ meeting, type: action, title: action === 'meeting_rescheduled' ? 'Meeting Rescheduled' : 'Meeting Updated', message: `${meeting.title} has been ${action === 'meeting_rescheduled' ? 'rescheduled' : 'updated'}.`, email: true });
  await logMeetingAction({ workspace, user: user._id, action, meeting, description: `${meeting.title} ${action.replace('meeting_', '')}`, oldValue, newValue: { startDateTime: meeting.startDateTime, endDateTime: meeting.endDateTime, status: meeting.status } });
  return meeting;
}

async function cancelMeeting({ workspace, meetingId, reason, user }) {
  const meeting = await Meeting.findOne({ _id: meetingId, workspace });
  if (!meeting) return null;
  meeting.status = 'cancelled';
  meeting.cancellationReason = reason;
  meeting.cancelledBy = user._id;
  meeting.cancelledAt = new Date();
  await meeting.save();
  await syncMeetingEvent(meeting);
  if (meeting.onlineMeeting?.provider === 'zoom') {
    zoomService.deleteZoomMeeting({ workspace, meetingId: meeting.onlineMeeting.meetingId }).catch(console.error);
  }
  await notifyAttendees({ meeting, type: 'meeting_cancelled', title: 'Meeting Cancelled', message: `${meeting.title} has been cancelled.`, email: true });
  await logMeetingAction({ workspace, user: user._id, action: 'meeting_cancelled', meeting, description: `Meeting cancelled: ${reason || meeting.title}` });
  return meeting;
}

async function completeMeeting({ workspace, meetingId, user }) {
  const meeting = await Meeting.findOne({ _id: meetingId, workspace });
  if (!meeting) return null;
  meeting.status = 'completed';
  meeting.completedAt = new Date();
  await meeting.save();
  await syncMeetingEvent(meeting);
  await notifyAttendees({ meeting, type: 'meeting_completed', title: 'Meeting Completed', message: `${meeting.title} has been marked completed.` });
  await notifyAttendees({ meeting, type: 'mom_required_after_meeting', title: 'MOM Required', message: `Create MOM for ${meeting.title}.` });
  await logMeetingAction({ workspace, user: user._id, action: 'meeting_completed', meeting, description: `Meeting completed: ${meeting.title}` });
  return meeting;
}

async function createMOMFromMeeting({ workspace, meetingId, user }) {
  const meeting = await Meeting.findOne({ _id: meetingId, workspace });
  if (!meeting) return null;
  if (meeting.mom) return MOM.findById(meeting.mom);
  const mom = await MOM.create({
    workspace,
    meeting: meeting._id,
    project: meeting.project,
    task: meeting.task,
    title: `MOM - ${meeting.title}`,
    meetingDate: meeting.startDateTime,
    location: meeting.location || meeting.onlineMeeting?.joinUrl || meeting.manualMeetingLink,
    agenda: meeting.agenda,
    attendees: (meeting.attendees || []).map((attendee) => ({
      user: attendee.user,
      name: attendee.name,
      department: attendee.department?.toString?.(),
      designation: attendee.designation,
      email: attendee.email,
      signatureRequired: true,
      signed: false
    })),
    createdBy: user._id
  });
  meeting.mom = mom._id;
  await meeting.save();
  await logMeetingAction({ workspace, user: user._id, action: 'mom_created_from_meeting', meeting, description: `MOM created from meeting: ${meeting.title}`, newValue: { mom: mom._id } });
  return mom;
}

module.exports = {
  createMeeting,
  updateMeeting,
  cancelMeeting,
  completeMeeting,
  createMOMFromMeeting,
  notifyAttendees
};
