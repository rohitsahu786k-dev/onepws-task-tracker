const nodemailer = require('nodemailer');
const SystemSettings = require('../models/SystemSettings');

let cachedTransporter = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get SMTP settings from DB (with fallback to .env)
 * Cache result for 5 minutes to avoid DB hit on every email
 */
const getTransporter = async () => {
  const now = Date.now();

  if (cachedTransporter && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
    return cachedTransporter;
  }

  let smtpConfig;

  try {
    const settings = await SystemSettings.findOne({ key: 'smtp' });
    if (settings?.value?.host) {
      smtpConfig = settings.value;
    }
  } catch (err) {
    console.warn('Could not load SMTP settings from DB, using .env fallback');
  }

  // Fallback to .env
  if (!smtpConfig) {
    smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || 'noreply@onepws.com',
    };
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure || false,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  cacheTimestamp = now;
  return cachedTransporter;
};

/**
 * Invalidate SMTP cache (call after admin updates SMTP settings)
 */
const invalidateSMTPCache = () => {
  cachedTransporter = null;
  cacheTimestamp = null;
};

/**
 * Send an email
 * @param {Object} options - { to, subject, html, text, from, attachments }
 */
const sendMail = async (options) => {
  const transporter = await getTransporter();

  let fromAddress = options.from;
  if (!fromAddress) {
    try {
      const settings = await SystemSettings.findOne({ key: 'smtp' });
      fromAddress = settings?.value?.from || process.env.SMTP_FROM || 'noreply@onepws.com';
    } catch {
      fromAddress = process.env.SMTP_FROM || 'noreply@onepws.com';
    }
  }

  return transporter.sendMail({
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments,
  });
};

module.exports = { getTransporter, sendMail, invalidateSMTPCache };
