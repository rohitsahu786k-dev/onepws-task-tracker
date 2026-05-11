const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const SystemSettings = require("../models/SystemSettings");
const fs = require("fs");
// Assuming a decrypt utility exists, mock for now
const decrypt = (val) => val; 

async function sendScheduledReportEmail({ workspace, recipients, reportType, filters, files }) {
  const settings = await SystemSettings.findOne({ workspace });

  if (!settings?.email?.smtpHost) {
    throw new Error("SMTP settings not configured");
  }

  const transporter = nodemailer.createTransport({
    host: settings.email.smtpHost,
    port: settings.email.smtpPort,
    secure: settings.email.encryption === "ssl",
    auth: {
      user: settings.email.smtpUser,
      pass: decrypt(settings.email.smtpPasswordEncrypted)
    }
  });

  const subject = `ONEPWS Scheduled Report: ${reportType}`;
  const text = `Hello,\\n\\nYour scheduled report is ready.\\n\\nReport Type: ${reportType}\\nGenerated At: ${new Date().toLocaleString()}\\n\\nPlease find the attached report(s).`;
  
  const attachments = [];
  if (files.pdf && fs.existsSync(files.pdf)) {
    attachments.push({ path: files.pdf });
  }
  if (files.excel && fs.existsSync(files.excel)) {
    attachments.push({ path: files.excel });
  }
  if (files.csv && fs.existsSync(files.csv)) {
    attachments.push({ path: files.csv });
  }

  for (const recipient of recipients) {
    if (!recipient.email) continue;
    try {
      await transporter.sendMail({
        from: `"${settings.email.fromName || 'ONEPWS'}" <${settings.email.fromAddress || 'no-reply@onepws.com'}>`,
        to: recipient.email,
        subject,
        text,
        attachments
      });
    } catch(err) {
      console.error(`Failed to send report to ${recipient.email}`, err);
    }
  }
}

async function sendReportEmail({ workspace, recipients, subject, message, files }) {
  const settings = await SystemSettings.findOne({ workspace });

  if (!settings?.email?.smtpHost) {
    throw new Error("SMTP settings not configured");
  }

  const transporter = nodemailer.createTransport({
    host: settings.email.smtpHost,
    port: settings.email.smtpPort,
    secure: settings.email.encryption === "ssl",
    auth: {
      user: settings.email.smtpUser,
      pass: decrypt(settings.email.smtpPasswordEncrypted)
    }
  });

  const attachments = Object.values(files || {})
    .filter((filePath) => filePath && fs.existsSync(filePath))
    .map((filePath) => ({ path: filePath }));

  await transporter.sendMail({
    from: `"${settings.email.fromName || 'ONEPWS'}" <${settings.email.fromAddress || 'no-reply@onepws.com'}>`,
    to: recipients.join(','),
    subject: subject || 'ONEPWS Report',
    text: message || 'Please find the attached ONEPWS report.',
    attachments
  });
}

module.exports = {
  sendScheduledReportEmail,
  sendReportEmail
};
