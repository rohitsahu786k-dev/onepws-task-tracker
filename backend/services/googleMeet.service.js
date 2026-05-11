const { google } = require('googleapis');
const SystemSettings = require('../models/SystemSettings');
const decrypt = require('../utils/decryptField');

function getOAuthClient(settings) {
  const oauth2Client = new google.auth.OAuth2(
    settings.googleMeet.clientId,
    decrypt(settings.googleMeet.clientSecretEncrypted),
    settings.googleMeet.redirectUri
  );
  oauth2Client.setCredentials({
    refresh_token: decrypt(settings.googleMeet.refreshTokenEncrypted)
  });
  return oauth2Client;
}

async function createGoogleMeet({ workspace, meeting }) {
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.googleMeet?.enabled) throw new Error('Google Meet integration is not enabled');
  if (!settings.googleMeet.refreshTokenEncrypted) throw new Error('Google Meet OAuth is not connected');

  const calendar = google.calendar({ version: 'v3', auth: getOAuthClient(settings) });
  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: meeting.title,
      description: meeting.agenda,
      start: { dateTime: meeting.startDateTime, timeZone: meeting.timezone || 'Asia/Kolkata' },
      end: { dateTime: meeting.endDateTime, timeZone: meeting.timezone || 'Asia/Kolkata' },
      attendees: (meeting.attendees || []).filter((attendee) => attendee.email).map((attendee) => ({ email: attendee.email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${meeting._id}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    }
  });

  return {
    provider: 'google_meet',
    joinUrl: event.data.hangoutLink,
    meetingId: event.data.id,
    providerResponse: event.data
  };
}

async function testGoogleMeetConnection(workspace) {
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.googleMeet?.enabled || !settings.googleMeet.refreshTokenEncrypted) {
    throw new Error('Google Meet integration is not configured');
  }
  const calendar = google.calendar({ version: 'v3', auth: getOAuthClient(settings) });
  const response = await calendar.calendarList.list({ maxResults: 1 });
  return response.data;
}

module.exports = {
  createGoogleMeet,
  testGoogleMeetConnection
};
