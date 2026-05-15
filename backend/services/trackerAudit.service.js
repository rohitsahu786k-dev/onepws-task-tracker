const ActivityLog = require('../models/ActivityLog');

const writeTrackerAudit = async ({
  workspace,
  user,
  action,
  rowId,
  fieldKey,
  oldValue,
  newValue,
  description,
  refModel = 'TrackerRow',
}) => {
  if (!workspace || !action) return null;

  return ActivityLog.create({
    workspace,
    user,
    module: 'tracker',
    action,
    refModel,
    refId: rowId,
    description,
    oldValue: fieldKey ? { fieldKey, value: oldValue } : oldValue,
    newValue: fieldKey ? { fieldKey, value: newValue } : newValue,
  });
};

module.exports = {
  writeTrackerAudit,
};
