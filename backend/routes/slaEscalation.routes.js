const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/sla.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('sla'));

router.get('/', checkPermission('sla', 'view'), ctrl.listEscalations);
router.get('/:escalationId', checkPermission('sla', 'view'), ctrl.getEscalation);
router.patch('/:escalationId/acknowledge', checkPermission('sla', 'view'), ctrl.acknowledgeEscalation);
router.patch('/:escalationId/resolve', checkPermission('sla', 'escalate'), ctrl.resolveEscalation);
router.patch('/:escalationId/ignore', checkPermission('sla', 'escalate'), ctrl.ignoreEscalation);

module.exports = router;
