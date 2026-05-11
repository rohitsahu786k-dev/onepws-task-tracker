const dayjs = require('dayjs');
const emailService = require('./email.service');
const SystemSettings = require('../models/SystemSettings');

function getMeetingLink(meeting) {
  return meeting.onlineMeeting?.joinUrl || meeting.manualMeetingLink || meeting.location || '';
}

function buildInviteHtml(meeting, attendee) {
  const date = dayjs(meeting.startDateTime).format('DD MMM YYYY');
  const start = dayjs(meeting.startDateTime).format('hh:mm A');
  const end = dayjs(meeting.endDateTime).format('hh:mm A');
  const link = getMeetingLink(meeting);
  return `
    <p>Hello ${attendee.name || 'there'},</p>
    <p>You have been invited to a meeting.</p>
    <table>
      <tr><td><strong>Meeting</strong></td><td>${meeting.title}</td></tr>
      <tr><td><strong>Meeting No.</strong></td><td>${meeting.meetingNumber || ''}</td></tr>
      <tr><td><strong>Date</strong></td><td>${date}</td></tr>
      <tr><td><strong>Time</strong></td><td>${start} - ${end}</td></tr>
      <tr><td><strong>Agenda</strong></td><td>${meeting.agenda || ''}</td></tr>
      <tr><td><strong>Location / Link</strong></td><td>${link}</td></tr>
    </table>
    ${link ? `<p><a href="${link}">Open Meeting</a></p>` : ''}
  `;
}

async function sendMeetingInvite(meeting) {
  const recipients = [
    ...(meeting.attendees || []).map((attendee) => ({ name: attendee.name, email: attendee.email })),
    ...(meeting.externalAttendees || []).map((attendee) => ({ name: attendee.name, email: attendee.email }))
  ].filter((attendee) => attendee.email);

  if (!recipients.length) return [];

  let transporter;
  try {
    transporter = await emailService.getTransporter(meeting.workspace);
  } catch (_error) {
    return [];
  }

  const settings = await SystemSettings.findOne({ workspace: meeting.workspace });
  const results = [];
  for (const attendee of recipients) {
    const date = dayjs(meeting.startDateTime).format('DD MMM YYYY');
    const result = await transporter.sendMail({
      from: `"${settings.email.fromName || 'ONEPWS'}" <${settings.email.fromAddress || settings.email.smtpUser}>`,
      to: attendee.email,
      subject: `Meeting Scheduled: ${meeting.title} - ${date}`,
      html: buildInviteHtml(meeting, attendee),
      text: `Meeting Scheduled: ${meeting.title}\nDate: ${date}\nLink: ${getMeetingLink(meeting)}`
    });
    results.push(result);
  }
  return results;
}

module.exports = { sendMeetingInvite, getMeetingLink };
