const notificationService = require('./notification.service');

async function sendSignatureRequestEmail(mom) {
  const recipients = (mom.attendees || [])
    .filter((attendee) => attendee.signatureRequired !== false && attendee.user && !attendee.signed)
    .map((attendee) => attendee.user);

  return notificationService.notify({
    workspace: mom.workspace,
    recipients,
    type: 'mom_sent_for_signature',
    title: `MOM Signature Required: ${mom.momNumber} - ${mom.title}`,
    message: `You are requested to review and sign ${mom.title}.`,
    refModel: 'MOM',
    refId: mom._id,
    actionUrl: `/mom/${mom._id}`,
    channels: { inApp: false, email: true },
    metadata: { momNumber: mom.momNumber, momTitle: mom.title, meetingDate: mom.meetingDate },
  });
}

module.exports = { sendSignatureRequestEmail };
