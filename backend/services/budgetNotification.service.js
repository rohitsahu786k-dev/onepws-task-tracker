const notificationService = require('./notification.service');

module.exports = {
  notify: notificationService.notify,
  notifyOncePerDay: notificationService.notifyOncePerDay,
};
