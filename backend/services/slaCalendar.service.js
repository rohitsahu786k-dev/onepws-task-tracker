const calendarService = require('./calendar.service');

module.exports = {
  createPhaseEvents: calendarService.syncSLAEvents,
  updatePhaseEvent: calendarService.updateSLAPhaseEvent,
  cancelPendingPhaseEvents: calendarService.cancelSLAEvents,
  markPhaseEventOverdue: calendarService.updateSLAPhaseEvent,
};
