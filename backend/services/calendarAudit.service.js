const ActivityLog = require('../models/ActivityLog');

const writeCalendarAudit = async ({
  workspace,
  user,
  action,
  eventId,
  description,
  oldValue,
  newValue,
}) => {
  if (!workspace || !action) return null;

  return ActivityLog.create({
    workspace,
    user,
    module: 'calendar',
    action,
    refModel: 'CalendarEvent',
    refId: eventId,
    description,
    oldValue,
    newValue,
  });
};

module.exports = {
  writeCalendarAudit,
};
