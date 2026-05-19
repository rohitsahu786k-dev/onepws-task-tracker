const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/email.service');
const slackService = require('../services/slack.service');
const telegramService = require('../services/telegram.service');
const SystemSettings = require('../models/SystemSettings');
const SettingsActivity = require('../models/SettingsActivity');
const zoomService = require('../services/zoom.service');
const googleMeetService = require('../services/googleMeet.service');
const settingsService = require('../services/settings.service');
const settingsActivityService = require('../services/settingsActivity.service');

const getWorkspaceId = (req) => req.params.wid || req.params.workspaceId || req.query.workspace || req.body.workspace || req.workspace?._id;

const getAllSettings = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const settings = await settingsService.getWorkspaceSettings(workspace);
  res.json({ success: true, data: settings, settings });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = req.params.category;
  if (!settingsService.getCategoryConfig(category)) {
    return res.status(400).json({ success: false, message: 'Invalid settings category' });
  }
  const data = await settingsService.getCategorySettings(getWorkspaceId(req), category);
  res.json({ success: true, data, settings: data });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = req.params.category;
  if (!settingsService.getCategoryConfig(category)) {
    return res.status(400).json({ success: false, message: 'Invalid settings category' });
  }

  const oldValue = await settingsService.getCategorySettings(getWorkspaceId(req), category);
  const updated = await settingsService.updateCategorySettings({
    workspace: getWorkspaceId(req),
    category,
    data: req.body,
    updatedBy: req.user?._id,
  });
  await settingsActivityService.log({
    workspace: getWorkspaceId(req),
    category,
    settingKey: category,
    oldValue,
    newValue: updated,
    changedBy: req.user?._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    reason: req.body.reason,
  });

  const warnings = category === 'modules' ? settingsService.moduleWarnings(updated) : [];
  res.json({
    success: true,
    message: warnings.length ? 'Settings updated with warnings' : 'Settings updated successfully',
    warnings,
    data: updated,
    settings: updated,
  });
});

const activity = asyncHandler(async (req, res) => {
  const query = { workspace: getWorkspaceId(req) };
  if (req.query.category) query.category = req.query.category;
  if (req.query.user) query.changedBy = req.query.user;
  const items = await SettingsActivity.find(query).populate('changedBy', 'name firstName lastName email').sort({ createdAt: -1 }).limit(Number(req.query.limit) || 100);
  res.json({ success: true, data: items, activity: items });
});

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

const getGoogleMeetAuthUrl = asyncHandler(async (req, res) => {
  const url = await googleMeetService.getGoogleMeetAuthUrl(req.params.wid);
  res.json({ success: true, data: { url } });
});

const googleMeetCallback = asyncHandler(async (req, res) => {
  const workspaceId = req.query.state || req.params.wid;
  const code = req.query.code;
  if (!code) return res.status(400).json({ success: false, message: 'Authorization code missing' });
  const result = await googleMeetService.handleGoogleMeetCallback({ workspace: workspaceId, code });
  res.json({ success: true, message: 'Google Meet connected successfully', data: result });
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
  getAllSettings,
  getCategory,
  updateCategory,
  activity,
  testEmail,
  testSlack,
  testTelegram,
  getZoomSettings,
  updateZoomSettings,
  testZoom,
  getGoogleMeetSettings,
  updateGoogleMeetSettings,
  testGoogleMeet,
  getGoogleMeetAuthUrl,
  googleMeetCallback,
  disconnectGoogleMeet
};
