const notificationService = require('./notification.service');

async function notifySignatureRequired({ workspace, sender, mom }) {
  const recipients = (mom.attendees || [])
    .filter((attendee) => attendee.signatureRequired !== false && attendee.user && !attendee.signed)
    .map((attendee) => attendee.user);
  return notificationService.notify({
    workspace,
    sender,
    recipients,
    type: 'mom_pending_signature',
    title: `MOM Signature Required: ${mom.momNumber}`,
    message: `Please review and sign ${mom.title}.`,
    refModel: 'MOM',
    refId: mom._id,
    actionUrl: `/mom/${mom._id}`,
    channels: { inApp: true, email: true },
    metadata: { momNumber: mom.momNumber, momTitle: mom.title, meetingDate: mom.meetingDate },
  });
}

module.exports = {
  notify: notificationService.notify,
  notifyOncePerDay: notificationService.notifyOncePerDay,
  notifySignatureRequired,
};
