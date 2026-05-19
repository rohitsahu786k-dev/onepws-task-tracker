const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/taskStage.controller');

const workspaceGate = (req, res, next) => {
  if (!req.params.wid && !req.body.workspace && !req.query.workspace) return next();
  return verifyWorkspaceAccess(req, res, next);
};

router.use(protect, workspaceGate, checkModuleEnabled('tasks'));

router.get('/', checkPermission('tasks', 'view'), ctrl.getAll);
router.post('/', checkPermission('tasks', 'assign'), ctrl.create);
router.patch('/reorder', checkPermission('tasks', 'assign'), ctrl.reorder);
router.get('/:stageId', checkPermission('tasks', 'view'), ctrl.getById);
router.put('/:stageId', checkPermission('tasks', 'assign'), ctrl.update);
router.delete('/:stageId', checkPermission('tasks', 'assign'), ctrl.remove);

module.exports = router;
