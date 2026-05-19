const MOM = require('../models/MOM');
const Meeting = require('../models/Meeting');
const momNumberService = require('./momNumber.service');
const momSignatureService = require('./momSignature.service');

async function createMOM(payload, user) {
  const actionPoints = (payload.actionPoints || []).map((point, index) => ({ ...point, pointNumber: point.pointNumber || index + 1 }));
  const mom = await MOM.create({
    ...payload,
    momNumber: payload.momNumber || await momNumberService.generateMOMNumber(payload.workspace),
    actionPoints,
    createdBy: payload.createdBy || user?._id,
  });
  mom.signatureSummary = momSignatureService.calculateSignatureSummary(mom);
  await mom.save();
  return mom;
}

async function prefillFromMeeting(workspace, meetingId) {
  const meeting = await Meeting.findOne({ _id: meetingId, workspace });
  if (!meeting) return null;
  const attendees = [
    ...(meeting.attendees || []).map((item) => ({
      user: item.user,
      name: item.name,
      email: item.email,
      department: item.department,
      designation: item.designation,
      attendeeType: item.attendeeType || 'internal',
      attendanceStatus: 'present',
      signatureRequired: true,
      signed: false,
    })),
    ...(meeting.externalAttendees || []).map((item) => ({
      name: item.name,
      email: item.email,
      designation: item.designation,
      attendeeType: 'external',
      attendanceStatus: 'present',
      signatureRequired: true,
      signed: false,
    })),
  ];

  return {
    title: `MOM - ${meeting.title}`,
    momType: ['kickoff', 'design_review', 'sla_review', 'budget_review', 'project_review'].includes(meeting.meetingType)
      ? meeting.meetingType
      : 'general',
    meeting: meeting._id,
    project: meeting.project,
    task: meeting.task,
    intakeForm: meeting.intakeForm,
    slaTracker: meeting.slaTracker,
    meetingDate: meeting.startDateTime,
    startTime: meeting.startDateTime,
    endTime: meeting.endDateTime,
    location: meeting.location,
    meetingLink: meeting.onlineMeeting?.joinUrl || meeting.manualMeetingLink,
    agenda: meeting.agenda,
    attendees,
  };
}

module.exports = { createMOM, prefillFromMeeting };
