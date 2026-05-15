const { google } = require('googleapis');
const SystemSettings = require('../models/SystemSettings');
const decrypt = require('../utils/decryptField');
const encryptField = require('../utils/encryptField');

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

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

async function getGoogleMeetAuthUrl(workspace) {
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.googleMeet?.clientId || !settings.googleMeet.clientSecretEncrypted) {
    throw new Error('Google Meet OAuth client credentials are not configured');
  }

  const oauth2Client = new google.auth.OAuth2(
    settings.googleMeet.clientId,
    decrypt(settings.googleMeet.clientSecretEncrypted),
    settings.googleMeet.redirectUri
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: String(workspace)
  });
}

async function handleGoogleMeetCallback({ workspace, code }) {
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.googleMeet?.clientId || !settings.googleMeet.clientSecretEncrypted) {
    throw new Error('Google Meet OAuth client credentials are not configured');
  }

  const oauth2Client = new google.auth.OAuth2(
    settings.googleMeet.clientId,
    decrypt(settings.googleMeet.clientSecretEncrypted),
    settings.googleMeet.redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh token. Reconnect with consent prompt.');
  }

  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const profile = await oauth2.userinfo.get();

  settings.googleMeet.refreshTokenEncrypted = encryptField(tokens.refresh_token);
  settings.googleMeet.connectedEmail = profile.data.email;
  settings.googleMeet.connectedAt = new Date();
  settings.googleMeet.enabled = true;
  await settings.save();

  return {
    connectedEmail: profile.data.email,
    connectedAt: settings.googleMeet.connectedAt
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
  testGoogleMeetConnection,
  getGoogleMeetAuthUrl,
  handleGoogleMeetCallback
};
