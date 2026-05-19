const notificationService = require('./notification.service');

async function notify(payload) {
  if (!payload?.recipients?.length) return null;
  return notificationService.notify(payload);
}

module.exports = { notify };
