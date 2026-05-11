const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');
const decrypt = require('../utils/decryptField');

async function getZoomAccessToken(settings) {
  const accountId = settings.zoom.accountId;
  const clientId = settings.zoom.clientId;
  const clientSecret = decrypt(settings.zoom.clientSecretEncrypted);

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    null,
    { headers: { Authorization: `Basic ${basicAuth}` } }
  );

  return response.data.access_token;
}

async function testZoomConnection(workspace) {
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.zoom?.enabled || !settings.zoom.accountId || !settings.zoom.clientId || !settings.zoom.clientSecretEncrypted) {
    throw new Error('Zoom integration is not configured');
  }
  const accessToken = await getZoomAccessToken(settings);
  const response = await axios.get('https://api.zoom.us/v2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
}

async function createZoomMeeting({ workspace, meeting }) {
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.zoom?.enabled) throw new Error('Zoom integration is not enabled');

  const accessToken = await getZoomAccessToken(settings);
  const response = await axios.post(
    'https://api.zoom.us/v2/users/me/meetings',
    {
      topic: meeting.title,
      type: 2,
      start_time: meeting.startDateTime,
      duration: meeting.durationMinutes,
      timezone: meeting.timezone || 'Asia/Kolkata',
      agenda: meeting.agenda,
      settings: {
        join_before_host: false,
        waiting_room: true,
        mute_upon_entry: true,
        approval_type: 0,
        audio: 'both'
      }
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return {
    provider: 'zoom',
    joinUrl: response.data.join_url,
    startUrl: response.data.start_url,
    meetingId: String(response.data.id),
    password: response.data.password,
    providerResponse: response.data
  };
}

async function deleteZoomMeeting({ workspace, meetingId }) {
  if (!meetingId) return null;
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.zoom?.enabled) return null;
  const accessToken = await getZoomAccessToken(settings);
  return axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

module.exports = {
  getZoomAccessToken,
  testZoomConnection,
  createZoomMeeting,
  deleteZoomMeeting
};
