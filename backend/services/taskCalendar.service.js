const calendarService = require('./calendar.service');

module.exports = {
  createTaskEvent: calendarService.syncTaskEvent,
  syncTaskCalendarEvent: calendarService.syncTaskEvent,
  cancelTaskEvent: calendarService.cancelTaskEvent,
  markTaskEventOverdue: calendarService.markTaskEventOverdue,
};
