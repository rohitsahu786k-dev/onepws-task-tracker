const axios = require('axios');
const Handlebars = require('handlebars');
const SystemSettings = require('../models/SystemSettings');
const NotificationTemplate = require('../models/NotificationTemplate');
const NotificationLog = require('../models/NotificationLog');
const decrypt = require('../utils/decryptField');

function escapeTelegramText(text = '') {
  return String(text)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function renderTelegramText({ workspace, event, notification, data = {} }) {
  const template = await NotificationTemplate.findOne({
    workspace,
    event,
    channel: 'telegram',
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
    : `${notification.title}\n${notification.message}`;

  return escapeTelegramText(rendered);
}

async function sendNotification({ workspace, event, notification, data }) {
  const log = await NotificationLog.create({
    workspace,
    notification: notification._id,
    channel: 'telegram',
    recipient: notification.recipient,
    status: 'pending'
  });

  try {
    const settings = await SystemSettings.findOne({ workspace });
    if (!settings?.telegram?.enabled) throw new Error('Telegram is disabled');

    const botToken = decrypt(settings.telegram.botTokenEncrypted);
    const chatId = settings.telegram.chatId;
    if (!botToken || !chatId) throw new Error('Telegram bot token or chat ID is not configured');

    const text = await renderTelegramText({ workspace, event, notification, data });
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      { chat_id: chatId, text, parse_mode: 'HTML' },
      { timeout: 10000 }
    );

    log.status = 'sent';
    log.sentAt = new Date();
    log.providerResponse = response.data;
    await log.save();

    notification.deliveryStatus.telegram = { sent: true, sentAt: new Date() };
    await notification.save();
  } catch (error) {
    log.status = 'failed';
    log.errorMessage = error.message;
    await log.save();

    notification.deliveryStatus.telegram = { sent: false, error: error.message };
    await notification.save();
  }
}

async function sendTestMessage({ workspace, message = 'ONEPWS Telegram integration test.' }) {
  const settings = await SystemSettings.findOne({ workspace });
  if (!settings?.telegram?.enabled) throw new Error('Telegram is disabled');

  const botToken = decrypt(settings.telegram.botTokenEncrypted);
  const chatId = settings.telegram.chatId;
  if (!botToken || !chatId) throw new Error('Telegram bot token or chat ID is not configured');

  return axios.post(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    { chat_id: chatId, text: message, parse_mode: 'HTML' },
    { timeout: 10000 }
  );
}

module.exports = { sendNotification, sendTestMessage };
