const ActivityLog = require('../models/ActivityLog');

const activityLogger = (moduleName, action) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 400 || !req.user?._id) return;
    try {
      await ActivityLog.create({
        workspace: req.params.wid || req.body.workspace || req.query.workspace,
        user: req.user._id,
        module: moduleName,
        action,
        description: `${action} ${moduleName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (error) {
      console.error('Activity logging failed:', error.message);
    }
  });
  next();
};

module.exports = activityLogger;
module.exports.activityLogger = activityLogger;
