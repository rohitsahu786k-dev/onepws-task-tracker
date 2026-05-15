const Meeting = require('../models/Meeting');
const MOM = require('../models/MOM');
const SLATracker = require('../models/SLATracker');

async function getWorkStartStatus(task) {
  const blockers = [];
  let canStartWork = true;

  if (!task.intakeForm) {
    canStartWork = false;
    blockers.push({ code: 'intake_missing', message: 'Intake form is not linked' });
  }

  let slaTracker = null;
  if (task.slaTracker) {
    slaTracker = await SLATracker.findById(task.slaTracker).select('t0Date kickoffMeetingDate momSignedAt overallStatus');
  }

  if (!slaTracker?.t0Date) {
    canStartWork = false;
    blockers.push({ code: 't0_missing', message: 'T0 date is not confirmed' });
  }

  const kickoffMeeting = await Meeting.findOne({
    workspace: task.workspace,
    task: task._id,
    meetingType: 'kickoff',
    status: 'completed'
  }).select('_id status mom meetingNumber');

  if (!kickoffMeeting) {
    canStartWork = false;
    blockers.push({ code: 'kickoff_incomplete', message: 'Kickoff meeting is not completed' });
  }

  let mom = null;
  if (kickoffMeeting?.mom) {
    mom = await MOM.findById(kickoffMeeting.mom).select('status momNumber');
  }

  if (!mom || mom.status !== 'signed') {
    canStartWork = false;
    blockers.push({ code: 'mom_unsigned', message: 'MOM is not signed' });
  }

  return {
    canStartWork,
    workStartBlocked: !canStartWork,
    blockers,
    kickoffMeeting: kickoffMeeting ? { _id: kickoffMeeting._id, meetingNumber: kickoffMeeting.meetingNumber, status: kickoffMeeting.status } : null,
    mom: mom ? { _id: mom._id, momNumber: mom.momNumber, status: mom.status } : null,
    suggestedKickoffDate: slaTracker?.t0Date ? require('./workingDays.service').addWorkingDays(slaTracker.t0Date, 1) : null
  };
}

module.exports = { getWorkStartStatus };
