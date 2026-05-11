const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/email.service');
const slackService = require('../services/slack.service');
const telegramService = require('../services/telegram.service');
const SystemSettings = require('../models/SystemSettings');
const zoomService = require('../services/zoom.service');
const googleMeetService = require('../services/googleMeet.service');

const testEmail = asyncHandler(async (req, res) => {
  const result = await emailService.sendTestEmail({
    workspace: req.params.wid,
    to: req.body.to || req.user.email,
    subject: req.body.subject,
    message: req.body.message
  });
  res.json({ success: true, data: result });
});

const testSlack = asyncHandler(async (req, res) => {
  const result = await slackService.sendTestMessage({
    workspace: req.params.wid,
    message: req.body.message
  });
  res.json({ success: true, data: result.data || { ok: true } });
});

const testTelegram = asyncHandler(async (req, res) => {
  const result = await telegramService.sendTestMessage({
    workspace: req.params.wid,
    message: req.body.message
  });
  res.json({ success: true, data: result.data });
});

const getZoomSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOne({ workspace: req.params.wid }).select('zoom');
  res.json({ success: true, data: settings?.zoom || {} });
});

const updateZoomSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOneAndUpdate(
    { workspace: req.params.wid },
    { $set: { zoom: req.body, updatedBy: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).select('zoom');
  res.json({ success: true, data: settings.zoom });
});

const testZoom = asyncHandler(async (req, res) => {
  const result = await zoomService.testZoomConnection(req.params.wid);
  res.json({ success: true, data: result });
});

const getGoogleMeetSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOne({ workspace: req.params.wid }).select('googleMeet');
  res.json({ success: true, data: settings?.googleMeet || {} });
});

const updateGoogleMeetSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOneAndUpdate(
    { workspace: req.params.wid },
    { $set: { googleMeet: req.body, updatedBy: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).select('googleMeet');
  res.json({ success: true, data: settings.googleMeet });
});

const testGoogleMeet = asyncHandler(async (req, res) => {
  const result = await googleMeetService.testGoogleMeetConnection(req.params.wid);
  res.json({ success: true, data: result });
});

const disconnectGoogleMeet = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOneAndUpdate(
    { workspace: req.params.wid },
    { $unset: { 'googleMeet.refreshTokenEncrypted': '', 'googleMeet.connectedEmail': '', 'googleMeet.connectedAt': '' } },
    { new: true }
  ).select('googleMeet');
  res.json({ success: true, data: settings?.googleMeet || {} });
});

module.exports = {
  testEmail,
  testSlack,
  testTelegram,
  getZoomSettings,
  updateZoomSettings,
  testZoom,
  getGoogleMeetSettings,
  updateGoogleMeetSettings,
  testGoogleMeet,
  disconnectGoogleMeet
};
