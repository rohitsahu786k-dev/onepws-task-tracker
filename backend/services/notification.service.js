const Notification = require('../models/Notification');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const { getIO } = require('../config/socket');
const emailService = require('./email.service');
const slackService = require('./slack.service');
const telegramService = require('./telegram.service');
const NotificationPreference = require('../models/NotificationPreference');

const EMAIL_SETTING_KEYS = {
  workspace_invited: 'workspaceInvitation',
  workspace_invitation: 'workspaceInvitation',
  task_assigned: 'taskAssignment',
  task_overdue: 'taskOverdue',
  task_due_today: 'taskOverdue',
  task_due_tomorrow: 'taskOverdue',
  task_commented: 'taskComment',
  mention: 'taskComment',
  meeting_scheduled: 'meetingScheduled',
  meeting_reminder: 'meetingScheduled',
  mom_created: 'momCreated',
  mom_signed: 'momSigned',
  mom_pending_signature: 'momSigned',
  sla_breach: 'slaBreach',
  sla_escalation: 'slaBreach',
  budget_approved: 'budgetApproval',
  budget_rejected: 'budgetApproval',
  expense_approved: 'expenseApproval',
  expense_rejected: 'expenseApproval',
  daily_digest: 'dailyDigest'
};

async function resolveChannels({ workspace, user, type, requestedChannels }) {
  const settings = await SystemSettings.findOne({ workspace });
  const emailSettingKey = EMAIL_SETTING_KEYS[type] || type;
  const workspaceEmailEnabled = settings?.emailNotifications?.[emailSettingKey] !== false;
  const prefsDoc = await NotificationPreference.findOne({ workspace, user: user._id });

  if (prefsDoc?.mutedUntil && new Date() < prefsDoc.mutedUntil) {
    return { inApp: false, email: false, slack: false, telegram: false };
  }

  const userPrefs = prefsDoc?.preferences?.[type] || {};

  return {
    inApp: requestedChannels.inApp !== false && userPrefs.inApp !== false,
    email: requestedChannels.email === true && workspaceEmailEnabled && userPrefs.email !== false,
    slack: requestedChannels.slack === true && settings?.slack?.enabled === true && userPrefs.slack !== false,
    telegram: requestedChannels.telegram === true && settings?.telegram?.enabled === true && userPrefs.telegram !== false
  };
}

async function sendInAppNotification(notification) {
  try {
    const io = getIO();
    io.to(`user:${notification.recipient.toString()}`).emit("notification:new", {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      priority: notification.priority,
      createdAt: notification.createdAt,
      metadata: notification.metadata
    });

    notification.deliveryStatus.inApp = { sent: true, sentAt: new Date() };
    await notification.save();
  } catch (err) {
    notification.deliveryStatus.inApp = { sent: false, error: err.message };
    await notification.save();
  }
}

async function notify(payload) {
  const {
    workspace,
    recipients,
    sender,
    type,
    title,
    message,
    refModel,
    refId,
    actionUrl,
    priority = "normal",
    channels = {},
    metadata = {}
  } = payload;

  if (!recipients || !recipients.length) return [];

  const uniqueRecipients = [...new Set(recipients.map(String))];
  const createdNotifications = [];

  for (const recipientId of uniqueRecipients) {
    const user = await User.findById(recipientId);
    if (!user || !user.isActive) continue;

    const finalChannels = await resolveChannels({ workspace, user, type, requestedChannels: channels });

    const notification = await Notification.create({
      workspace,
      recipient: recipientId,
      sender,
      type,
      title,
      message,
      shortMessage: message, // fallback
      refModel,
      refId,
      actionUrl,
      priority,
      channels: finalChannels,
      metadata,
      deliveryStatus: {
        inApp: { sent: false },
        email: { sent: false },
        slack: { sent: false },
        telegram: { sent: false }
      }
    });

    createdNotifications.push(notification);

    if (finalChannels.inApp) {
      await sendInAppNotification(notification);
    }

    // Fire and forget (don't block the API)
    if (finalChannels.email) {
      emailService.sendNotificationEmail({ workspace, user, event: type, notification, data: metadata }).catch(console.error);
    }
    if (finalChannels.slack) {
      slackService.sendNotification({ workspace, event: type, notification, data: metadata }).catch(console.error);
    }
    if (finalChannels.telegram) {
      telegramService.sendNotification({ workspace, event: type, notification, data: metadata }).catch(console.error);
    }
  }

  return createdNotifications;
}

async function notifyOncePerDay(payload) {
  const dayjs = require('dayjs');
  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();

  for (const recipient of payload.recipients) {
    const exists = await Notification.findOne({
      workspace: payload.workspace,
      recipient,
      type: payload.type,
      refModel: payload.refModel,
      refId: payload.refId,
      createdAt: { $gte: start, $lte: end }
    });

    if (exists) continue;

    await notify({
      ...payload,
      recipients: [recipient]
    });
  }
}

async function retryDelivery(log) {
  const notification = await Notification.findById(log.notification);
  if (!notification) return null;
  const user = await User.findById(log.recipient || notification.recipient);
  if (!user) return null;

  log.retryCount += 1;
  log.status = 'pending';
  await log.save();

  if (log.channel === 'email') {
    return emailService.sendNotificationEmail({
      workspace: notification.workspace,
      user,
      event: notification.type,
      notification,
      data: notification.metadata || {}
    });
  }

  if (log.channel === 'slack') {
    return slackService.sendNotification({
      workspace: notification.workspace,
      event: notification.type,
      notification,
      data: notification.metadata || {}
    });
  }

  if (log.channel === 'telegram') {
    return telegramService.sendNotification({
      workspace: notification.workspace,
      event: notification.type,
      notification,
      data: notification.metadata || {}
    });
  }

  return null;
}

module.exports = {
  notify,
  notifyOncePerDay,
  retryDelivery
};
