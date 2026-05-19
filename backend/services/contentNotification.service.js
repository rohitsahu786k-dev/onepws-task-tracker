const notificationService = require('./notification.service');

function notify(payload) {
  return notificationService.notify(payload);
}

module.exports = { notify };
