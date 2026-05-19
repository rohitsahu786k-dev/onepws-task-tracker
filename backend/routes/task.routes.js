const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const { checkAnyPermission } = require('../utils/permission');
const { checkTaskUpdateAccess } = require('../middleware/ownership.middleware');
const ctrl = require('../controllers/task.controller');
const timesheetCtrl = require('../controllers/timesheet.controller');
const timeLogCtrl = require('../controllers/timeLog.controller');

const workspaceGate = (req, res, next) => {
  if (!req.params.wid && !req.body.workspace && !req.query.workspace) return next();
  return verifyWorkspaceAccess(req, res, next);
};

const canUpdateTask = checkAnyPermission([
  { module: 'tasks', action: 'update' },
  { module: 'tasks', action: 'update_own' },
  { module: 'tasks', action: 'update_assigned' },
]);

const canChangeStage = checkAnyPermission([
  { module: 'tasks', action: 'change_stage' },
  { module: 'tasks', action: 'change_own_stage' },
  { module: 'tasks', action: 'update' },
  { module: 'tasks', action: 'update_assigned' },
]);

router.use(protect, workspaceGate, checkModuleEnabled('tasks'));

router.get('/my', checkPermission('tasks', 'view'), ctrl.my);
router.get('/due-today', checkPermission('tasks', 'view'), ctrl.dueToday);
router.get('/due-tomorrow', checkPermission('tasks', 'view'), ctrl.dueTomorrow);
router.get('/overdue', checkPermission('tasks', 'view'), ctrl.overdue);
router.get('/kanban', checkPermission('tasks', 'view'), ctrl.getKanban);
router.get('/calendar', checkPermission('tasks', 'view'), ctrl.getCalendar);
router.get('/reports/summary', checkPermission('tasks', 'view'), ctrl.reports);
router.get('/import-template', checkPermission('tasks', 'view'), ctrl.importTemplate);
router.post('/import', checkPermission('tasks', 'create'), ctrl.importTasks);
router.post('/export/:format', checkPermission('tasks', 'view'), ctrl.exportTasks);
router.post('/bulk-update', canUpdateTask, ctrl.bulkUpdate);
router.post('/bulk-delete', checkPermission('tasks', 'delete'), ctrl.bulkDelete);
router.post('/bulk-assign', checkPermission('tasks', 'assign'), ctrl.bulkAssign);
router.post('/bulk-stage-change', canChangeStage, ctrl.bulkStageChange);

router.get('/', checkPermission('tasks', 'view'), ctrl.getAll);
router.post('/', checkPermission('tasks', 'create'), ctrl.create);

router.get('/:taskId/work-start', checkPermission('tasks', 'view'), ctrl.getWorkStart);
router.get('/:taskId', checkPermission('tasks', 'view'), ctrl.getById);
router.put('/:id', canUpdateTask, checkTaskUpdateAccess, ctrl.update);
router.delete('/:taskId', checkPermission('tasks', 'delete'), ctrl.remove);
router.patch('/:taskId/restore', checkPermission('tasks', 'delete'), ctrl.restore);

router.patch('/:id/stage', canChangeStage, checkTaskUpdateAccess, ctrl.changeStage);
router.patch('/:id/status', canChangeStage, checkTaskUpdateAccess, ctrl.updateStatus);
router.patch('/:id/assign', checkPermission('tasks', 'assign'), checkTaskUpdateAccess, ctrl.assign);
router.patch('/:id/priority', canUpdateTask, checkTaskUpdateAccess, ctrl.updatePriority);
router.patch('/:id/due-date', canUpdateTask, checkTaskUpdateAccess, ctrl.updateDueDate);
router.patch('/:id/hold', canUpdateTask, checkTaskUpdateAccess, ctrl.hold);
router.patch('/:id/close', canUpdateTask, checkTaskUpdateAccess, ctrl.close);
router.patch('/:id/reopen', canUpdateTask, checkTaskUpdateAccess, ctrl.reopen);
router.patch('/:id/cancel', canUpdateTask, checkTaskUpdateAccess, ctrl.cancel);

router.post('/:taskId/subtasks', checkPermission('tasks', 'create'), ctrl.createSubtask);
router.get('/:taskId/subtasks', checkPermission('tasks', 'view'), ctrl.listSubtasks);

router.post('/:taskId/checklist', canUpdateTask, ctrl.addChecklistItem);
router.patch('/:taskId/checklist/:itemId', canUpdateTask, ctrl.updateChecklistItem);
router.delete('/:taskId/checklist/:itemId', canUpdateTask, ctrl.deleteChecklistItem);
router.patch('/:taskId/checklist/:itemId/toggle', canUpdateTask, ctrl.toggleChecklistItem);

router.get('/:taskId/comments', checkPermission('tasks', 'view'), ctrl.listComments);
router.post('/:taskId/comments', checkPermission('tasks', 'comment'), ctrl.addComment);
router.put('/:taskId/comments/:commentId', checkPermission('tasks', 'comment'), ctrl.updateComment);
router.delete('/:taskId/comments/:commentId', checkPermission('tasks', 'comment'), ctrl.deleteComment);

router.post('/:taskId/attachments', canUpdateTask, ctrl.addAttachment);
router.get('/:taskId/attachments', checkPermission('tasks', 'view'), ctrl.listAttachments);
router.delete('/:taskId/attachments/:attachmentId', canUpdateTask, ctrl.deleteAttachment);

router.post('/:taskId/dependencies', canUpdateTask, ctrl.addDependency);
router.get('/:taskId/dependencies', checkPermission('tasks', 'view'), ctrl.listDependencies);
router.delete('/:taskId/dependencies/:dependencyId', canUpdateTask, ctrl.deleteDependency);

router.post('/:taskId/revision', canUpdateTask, ctrl.requestRevision);
router.post('/:taskId/request-feedback', canUpdateTask, ctrl.requestFeedback);
router.post('/:taskId/submit-feedback', canUpdateTask, ctrl.submitFeedback);
router.patch('/:taskId/feedback/mark-received', canUpdateTask, ctrl.markFeedbackReceived);

router.post('/:taskId/request-approval', canUpdateTask, ctrl.requestApproval);
router.patch('/:taskId/approve', checkPermission('tasks', 'comment'), ctrl.approve);
router.patch('/:taskId/reject', checkPermission('tasks', 'comment'), ctrl.reject);

router.post('/:taskId/timer/start', canUpdateTask, timesheetCtrl.startTimer);
router.post('/:taskId/timer/pause', canUpdateTask, timesheetCtrl.pauseTimer);
router.post('/:taskId/timer/resume', canUpdateTask, timesheetCtrl.resumeTimer);
router.post('/:taskId/timer/stop', canUpdateTask, timesheetCtrl.stopTimer);
router.post('/:taskId/time-log', canUpdateTask, timeLogCtrl.create);
router.get('/:taskId/time-logs', checkPermission('tasks', 'view'), timeLogCtrl.list);
router.delete('/:taskId/time-logs/:timeLogId', canUpdateTask, timeLogCtrl.remove);

module.exports = router;
