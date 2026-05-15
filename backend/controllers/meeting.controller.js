const asyncHandler = require('../utils/asyncHandler');
const Meeting = require('../models/Meeting');
const meetingService = require('../services/meeting.service');
const { checkMeetingConflicts } = require('../services/meetingConflict.service');
const zoomService = require('../services/zoom.service');
const googleMeetService = require('../services/googleMeet.service');
const { getMeetingReport } = require('../services/meetingReport.service');
const SLATracker = require('../models/SLATracker');
const { addWorkingDays } = require('../services/workingDays.service');

function buildMeetingQuery(req) {
  const query = { workspace: req.params.wid };
  if (req.query.status) query.status = req.query.status;
  if (req.query.meetingType) query.meetingType = req.query.meetingType;
  if (req.query.meetingMode) query.meetingMode = req.query.meetingMode;
  if (req.query.project) query.project = req.query.project;
  if (req.query.task) query.task = req.query.task;
  if (req.query.attendee) query['attendees.user'] = req.query.attendee;
  if (req.query.dateFrom || req.query.dateTo) {
    query.startDateTime = {};
    if (req.query.dateFrom) query.startDateTime.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) query.startDateTime.$lte = new Date(req.query.dateTo);
  }

  if (req.workspaceRole === 'member') {
    query.$or = [{ createdBy: req.user._id }, { 'attendees.user': req.user._id }];
  } else if (req.workspaceRole === 'manager' && req.workspaceDepartment) {
    query.$or = [
      { createdBy: req.user._id },
      { 'attendees.user': req.user._id },
      { 'attendees.department': req.workspaceDepartment }
    ];
  }

  return query;
}

const createMeeting = asyncHandler(async (req, res) => {
  try {
    const meeting = await meetingService.createMeeting({
      workspace: req.params.wid,
      payload: req.body,
      user: req.user
    });
    res.status(201).json({ success: true, message: 'Meeting created successfully', data: meeting });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message, conflicts: error.conflicts });
  }
});

const getMeetings = asyncHandler(async (req, res) => {
  const meetings = await Meeting.find(buildMeetingQuery(req))
    .populate('createdBy', 'name email')
    .populate('project', 'title name projectCode')
    .populate('task', 'taskNumber title')
    .populate('attendees.user', 'name email designation')
    .populate('mom', 'momNumber status')
    .sort({ startDateTime: 1 });
  res.json({ success: true, data: meetings });
});

const getMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspace: req.params.wid })
    .populate('createdBy', 'name email')
    .populate('project', 'title name projectCode')
    .populate('task', 'taskNumber title')
    .populate('intakeForm', 'requestNumber title')
    .populate('slaTracker', 'overallStatus t0Date')
    .populate('attendees.user', 'name email designation')
    .populate('mom', 'momNumber status');
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, data: meeting });
});

const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.updateMeeting({
    workspace: req.params.wid,
    meetingId: req.params.id,
    payload: req.body,
    user: req.user
  });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, message: 'Meeting updated successfully', data: meeting });
});

const deleteMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, workspace: req.params.wid });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, message: 'Meeting deleted successfully' });
});

const cancelMeeting = asyncHandler(async (req, res) => {
  if (!req.body.reason) return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
  const meeting = await meetingService.cancelMeeting({
    workspace: req.params.wid,
    meetingId: req.params.id,
    reason: req.body.reason,
    user: req.user
  });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, message: 'Meeting cancelled successfully', data: meeting });
});

const completeMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.completeMeeting({ workspace: req.params.wid, meetingId: req.params.id, user: req.user });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, message: 'Meeting completed successfully', data: meeting });
});

const rescheduleMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.updateMeeting({
    workspace: req.params.wid,
    meetingId: req.params.id,
    payload: { startDateTime: req.body.startDateTime, endDateTime: req.body.endDateTime, timezone: req.body.timezone },
    user: req.user
  });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, message: 'Meeting rescheduled successfully', data: meeting });
});

const respondToMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  const attendee = meeting.attendees.find((item) => String(item.user) === String(req.user._id));
  if (!attendee) return res.status(403).json({ success: false, message: 'Only attendees can respond to this meeting' });
  attendee.responseStatus = req.body.responseStatus;
  attendee.responseAt = new Date();
  await meeting.save();
  await meetingService.notifyAttendees({
    meeting,
    type: 'meeting_attendee_responded',
    title: 'Meeting Response Updated',
    message: `${req.user.name} responded ${req.body.responseStatus} for ${meeting.title}`
  });
  res.json({ success: true, data: meeting });
});

const checkConflict = asyncHandler(async (req, res) => {
  const result = await checkMeetingConflicts({
    workspace: req.params.wid,
    attendees: req.body.attendees || [],
    startDateTime: req.body.startDateTime,
    endDateTime: req.body.endDateTime,
    excludeMeeting: req.body.excludeMeeting
  });
  res.json({ success: true, data: result });
});

const addZoomLink = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  meeting.onlineMeeting = await zoomService.createZoomMeeting({ workspace: req.params.wid, meeting });
  meeting.meetingMode = 'zoom';
  await meeting.save();
  res.json({ success: true, data: meeting });
});

const addGoogleMeetLink = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  meeting.onlineMeeting = await googleMeetService.createGoogleMeet({ workspace: req.params.wid, meeting });
  meeting.meetingMode = 'google_meet';
  await meeting.save();
  res.json({ success: true, data: meeting });
});

const sendInvite = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  await meetingService.notifyAttendees({ meeting, type: 'meeting_scheduled', title: 'Meeting Invite', message: `Invite for ${meeting.title}`, email: true });
  res.json({ success: true, message: 'Meeting invite sent successfully' });
});

const createMOM = asyncHandler(async (req, res) => {
  const mom = await meetingService.createMOMFromMeeting({ workspace: req.params.wid, meetingId: req.params.id, user: req.user });
  if (!mom) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.status(201).json({ success: true, data: mom });
});

const addAttachment = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  meeting.attachments.push({ ...req.body, uploadedBy: req.user._id, uploadedAt: new Date() });
  await meeting.save();
  res.status(201).json({ success: true, data: meeting });
});

const getMeetingReportHandler = asyncHandler(async (req, res) => {
  const report = await getMeetingReport(req.params.wid, req.query);
  res.json({ success: true, data: report });
});

const suggestKickoffDate = asyncHandler(async (req, res) => {
  const { taskId, slaTrackerId, intakeFormId } = req.query;
  let slaTracker = null;

  if (slaTrackerId) {
    slaTracker = await SLATracker.findOne({ _id: slaTrackerId, workspace: req.params.wid });
  } else if (taskId) {
    const meeting = await Meeting.findOne({ workspace: req.params.wid, task: taskId, meetingType: 'kickoff' }).select('status');
    slaTracker = await SLATracker.findOne({ workspace: req.params.wid, task: taskId }).select('t0Date kickoffMeetingDate');
    if (meeting) {
      return res.json({
        success: true,
        data: {
          hasKickoffMeeting: true,
          kickoffStatus: meeting.status,
          suggestedDate: slaTracker?.t0Date ? addWorkingDays(slaTracker.t0Date, 1) : null
        }
      });
    }
  }

  if (!slaTracker?.t0Date) {
    return res.status(400).json({ success: false, message: 'T0 date must be confirmed before suggesting kickoff meeting date' });
  }

  res.json({
    success: true,
    data: {
      hasKickoffMeeting: false,
      suggestedDate: addWorkingDays(slaTracker.t0Date, 1),
      t0Date: slaTracker.t0Date,
      intakeFormId: intakeFormId || slaTracker.intakeForm
    }
  });
});

const removeAttachment = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  meeting.attachments = meeting.attachments.filter((attachment) => String(attachment._id) !== String(req.params.attachmentId));
  await meeting.save();
  res.json({ success: true, data: meeting });
});

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  cancelMeeting,
  completeMeeting,
  rescheduleMeeting,
  respondToMeeting,
  checkConflict,
  addZoomLink,
  addGoogleMeetLink,
  sendInvite,
  createMOM,
  addAttachment,
  removeAttachment,
  getMeetingReport: getMeetingReportHandler,
  suggestKickoffDate
};
