const nodemailer = require('nodemailer');
const Handlebars = require('handlebars');
const EmailTemplate = require('../models/EmailTemplate');
const SystemSettings = require('../models/SystemSettings');
const NotificationLog = require('../models/NotificationLog');
const decrypt = require('../utils/decryptField');

function stripUnsafeHtml(html = '') {
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

async function getTransporter(workspace) {
  const settings = await SystemSettings.findOne({ workspace });

  if (!settings?.email?.smtpHost) {
    throw new Error('SMTP settings not configured');
  }

  return nodemailer.createTransport({
    host: settings.email.smtpHost,
    port: settings.email.smtpPort || 587,
    secure: settings.email.encryption === 'ssl',
    auth: {
      user: settings.email.smtpUser,
      pass: decrypt(settings.email.smtpPasswordEncrypted)
    }
  });
}

async function renderEmailTemplate({ workspace, event, user, notification, data = {} }) {
  const template = await EmailTemplate.findOne({ workspace, event, isActive: true });

  if (!template) {
    throw new Error(`Email template not found for event: ${event}`);
  }

  const variables = {
    userName: user.name,
    userEmail: user.email,
    appName: 'ONEPWS',
    currentDate: new Date().toLocaleDateString('en-IN'),
    notificationTitle: notification.title,
    notificationMessage: notification.message,
    actionUrl: `${process.env.CLIENT_URL || ''}${notification.actionUrl || ''}`,
    ...data
  };

  return {
    subject: Handlebars.compile(template.subject || notification.title)(variables),
    html: stripUnsafeHtml(Handlebars.compile(template.htmlBody || '<p>{{notificationMessage}}</p>')(variables)),
    text: template.textBody ? Handlebars.compile(template.textBody)(variables) : notification.message
  };
}

async function sendNotificationEmail({ workspace, user, event, notification, data }) {
  const log = await NotificationLog.create({
    workspace,
    notification: notification._id,
    channel: 'email',
    recipient: user._id,
    recipientEmail: user.email,
    status: 'pending'
  });

  try {
    const settings = await SystemSettings.findOne({ workspace });
    const rendered = await renderEmailTemplate({ workspace, event, user, notification, data });
    const transporter = await getTransporter(workspace);

    const result = await transporter.sendMail({
      from: `"${settings.email.fromName || 'ONEPWS'}" <${settings.email.fromAddress || settings.email.smtpUser}>`,
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    });

    log.status = 'sent';
    log.sentAt = new Date();
    log.providerResponse = result;
    await log.save();

    notification.deliveryStatus.email = { sent: true, sentAt: new Date() };
    await notification.save();

    return result;
  } catch (error) {
    log.status = 'failed';
    log.errorMessage = error.message;
    await log.save();

    notification.deliveryStatus.email = { sent: false, error: error.message };
    await notification.save();

    return null;
  }
}

async function sendTestEmail({ workspace, to, subject = 'ONEPWS SMTP test', message = 'SMTP is configured correctly.' }) {
  const settings = await SystemSettings.findOne({ workspace });
  const transporter = await getTransporter(workspace);

  return transporter.sendMail({
    from: `"${settings.email.fromName || 'ONEPWS'}" <${settings.email.fromAddress || settings.email.smtpUser}>`,
    to,
    subject,
    html: `<p>${Handlebars.escapeExpression(message)}</p>`,
    text: message
  });
}

module.exports = {
  getTransporter,
  renderEmailTemplate,
  sendNotificationEmail,
  sendTestEmail
};
