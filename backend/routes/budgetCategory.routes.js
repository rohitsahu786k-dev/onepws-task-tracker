const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/budgetCategory.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('budget'));

router.get('/', checkPermission('budget', 'view'), ctrl.getAll);
router.post('/', checkPermission('budget', 'create'), ctrl.create);
router.put('/:id', checkPermission('budget', 'update'), ctrl.update);
router.delete('/:id', checkPermission('budget', 'delete'), ctrl.remove);

module.exports = router;
