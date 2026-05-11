const Task = require('../models/Task');
const TrackerRow = require('../models/TrackerRow');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');
const { hasPermission, isSuperAdmin } = require('../utils/permission');

async function checkTaskUpdateAccess(req, res, next) {
  try {
    if (!req.workspace) return next();
    const task = await Task.findOne({ _id: req.params.id, workspace: req.workspace._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    req.task = task;
    if (isSuperAdmin(req.user) || req.workspaceRole === 'admin') return next();

    if (await hasPermission(req.user, req.workspace, req.workspaceRole, 'tasks', 'update', req.workspaceMembership)) {
      return next();
    }

    const userId = req.user._id.toString();
    const isCreator = task.createdBy?.toString() === userId;
    const isAssigned = task.assignedTo?.some((id) => id.toString() === userId);
    const canUpdateOwn = await hasPermission(req.user, req.workspace, req.workspaceRole, 'tasks', 'update_own', req.workspaceMembership);
    const canUpdateAssigned = await hasPermission(req.user, req.workspace, req.workspaceRole, 'tasks', 'update_assigned', req.workspaceMembership);

    if ((isCreator && canUpdateOwn) || (isAssigned && canUpdateAssigned)) return next();

    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'You can only update your own or assigned tasks',
      errorCode: 'PERMISSION_DENIED'
    });
  } catch (error) {
    next(error);
  }
}

async function checkTrackerRowAccess(req, res, next) {
  try {
    if (!req.workspace) return next();
    const row = await TrackerRow.findOne({
      _id: req.params.rowId,
      workspace: req.workspace._id,
      isDeleted: { $ne: true }
    });

    if (!row) return res.status(404).json({ success: false, message: 'Tracker row not found' });
    req.trackerRow = row;

    if (isSuperAdmin(req.user) || req.workspaceRole === 'admin') return next();
    if (row.isLocked) {
      return res.status(403).json({ success: false, message: 'This tracker row is locked', errorCode: 'ROW_LOCKED' });
    }

    if (await hasPermission(req.user, req.workspace, req.workspaceRole, 'tracker', 'update_any_row', req.workspaceMembership)) {
      return next();
    }

    const department = row.rowData?.get('task_given_by_department')?.toString();
    if (
      req.workspaceRole === 'manager' &&
      department &&
      department === req.workspaceDepartment?.toString() &&
      (await hasPermission(req.user, req.workspace, req.workspaceRole, 'tracker', 'update_department_row', req.workspaceMembership))
    ) {
      return next();
    }

    const handledBy = row.rowData?.get('task_handled_by')?.toString();
    if (
      handledBy === req.user._id.toString() &&
      (await hasPermission(req.user, req.workspace, req.workspaceRole, 'tracker', 'update_own_row', req.workspaceMembership))
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'You do not have permission to update this tracker row',
      errorCode: 'PERMISSION_DENIED'
    });
  } catch (error) {
    next(error);
  }
}

async function checkTrackerCellFieldAccess(req, res, next) {
  try {
    const fieldKey = req.body.fieldKey;
    const row = req.trackerRow;
    const config = await TrackerFieldConfig.findOne({ _id: row.config, workspace: req.workspace._id });
    const field = config?.fields?.find((item) => item.fieldKey === fieldKey && item.isDeleted !== true);

    if (!field) return res.status(404).json({ success: false, message: 'Tracker field not found' });
    if (field.isSystem || field.isEditable === false) {
      return res.status(403).json({ success: false, message: 'This field cannot be edited', errorCode: 'FIELD_LOCKED' });
    }

    if (isSuperAdmin(req.user) || req.workspaceRole === 'admin') return next();

    const role = req.workspaceRole;
    if (field.permissions?.hideFromRoles?.includes(role) || (field.permissions?.viewRoles?.length && !field.permissions.viewRoles.includes(role))) {
      return res.status(403).json({ success: false, message: 'This field is not visible for your role', errorCode: 'FIELD_HIDDEN' });
    }
    if (field.permissions?.editRoles?.length && !field.permissions.editRoles.includes(role)) {
      return res.status(403).json({ success: false, message: 'This field is not editable for your role', errorCode: 'FIELD_READ_ONLY' });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkTaskUpdateAccess,
  checkTrackerRowAccess,
  checkTrackerCellFieldAccess
};
