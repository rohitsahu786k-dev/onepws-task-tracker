const axios = require('axios');
const Handlebars = require('handlebars');
const SystemSettings = require('../models/SystemSettings');
const NotificationTemplate = require('../models/NotificationTemplate');
const NotificationLog = require('../models/NotificationLog');
const decrypt = require('../utils/decryptField');

function stripUnsafeText(text = '') {
  return String(text)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

async function renderSlackText({ workspace, event, notification, data = {} }) {
  const template = await NotificationTemplate.findOne({
    workspace,
    event,
    channel: 'slack',
    isActive: true
  });

  const variables = {
    title: notification.title,
    message: notification.message,
    actionUrl: `${process.env.CLIENT_URL || ''}${notification.actionUrl || ''}`,
    ...data
  };

  const rendered = template
    ? Handlebars.compile(template.bodyTemplate || '{{title}}\n{{message}}')(variables)
    : `*${notification.title}*\n${notification.message}`;

  return stripUnsafeText(rendered);
}

async function sendNotification({ workspace, event, notification, data }) {
  const log = await NotificationLog.create({
    workspace,
    notification: notification._id,
    channel: 'slack',
    recipient: notification.recipient,
    status: 'pending'
  });

  try {
    const settings = await SystemSettings.findOne({ workspace });
    if (!settings?.slack?.enabled) throw new Error('Slack is disabled');

    const webhookUrl = decrypt(settings.slack.webhookUrlEncrypted);
    if (!webhookUrl) throw new Error('Slack webhook is not configured');

    const text = await renderSlackText({ workspace, event, notification, data });
    const response = await axios.post(webhookUrl, { text }, { timeout: 10000 });

    log.status = 'sent';
    log.sentAt = new Date();
    log.providerResponse = response.data || { ok: true };
    await log.save();

    notification.deliveryStatus.slack = { sent: true, sentAt: new Date() };
    await notification.save();
  } catch (error) {
    log.status = 'failed';
    log.errorMessage = error.message;
    await log.save();

    notification.deliveryStatus.slack = { sent: false, error: error.message };
    await notification.save();
  }
}

async function sendTestMessage({ workspace, message = 'ONEPWS Slack integration test.' }) {
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.slack?.enabled) throw new Error('Slack is disabled');
  const webhookUrl = decrypt(settings.slack.webhookUrlEncrypted);
  if (!webhookUrl) throw new Error('Slack webhook is not configured');
  return axios.post(webhookUrl, { text: message }, { timeout: 10000 });
}

module.exports = { sendNotification, sendTestMessage };
