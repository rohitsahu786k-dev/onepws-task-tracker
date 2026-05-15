const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const { checkAnyPermission } = require('../utils/permission');
const { checkTaskUpdateAccess } = require('../middleware/ownership.middleware');
const ctrl = require('../controllers/task.controller');

const workspaceGate = (req, res, next) => {
  if (!req.params.wid && !req.body.workspace && !req.query.workspace) return next();
  return verifyWorkspaceAccess(req, res, next);
};

router.use(protect, workspaceGate);

router.get('/', checkModuleEnabled('tasks'), checkPermission('tasks', 'view'), ctrl.getAll);
router.post('/', checkModuleEnabled('tasks'), checkPermission('tasks', 'create'), ctrl.create);
router.get('/:id/work-start', checkModuleEnabled('tasks'), checkPermission('tasks', 'view'), ctrl.getWorkStart);
router.get('/:id', checkModuleEnabled('tasks'), checkPermission('tasks', 'view'), ctrl.getById);
router.put(
  '/:id',
  checkModuleEnabled('tasks'),
  checkAnyPermission([
    { module: 'tasks', action: 'update' },
    { module: 'tasks', action: 'update_own' },
    { module: 'tasks', action: 'update_assigned' }
  ]),
  checkTaskUpdateAccess,
  ctrl.update
);
router.patch(
  '/:id/status',
  checkModuleEnabled('tasks'),
  checkAnyPermission([
    { module: 'tasks', action: 'change_stage' },
    { module: 'tasks', action: 'change_own_stage' },
    { module: 'tasks', action: 'update' },
    { module: 'tasks', action: 'update_assigned' }
  ]),
  checkTaskUpdateAccess,
  ctrl.updateStatus
);
router.delete('/:id', checkModuleEnabled('tasks'), checkPermission('tasks', 'delete'), ctrl.remove);

module.exports = router;
