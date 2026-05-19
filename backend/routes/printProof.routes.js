const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/printProof.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('print_jobs'));

router.get('/:proofId', ctrl.getById);
router.put('/:proofId', ctrl.update);
router.delete('/:proofId', ctrl.remove);
router.patch('/:proofId/approve', ctrl.approve);
router.patch('/:proofId/reject', ctrl.reject);
router.patch('/:proofId/request-changes', ctrl.requestChanges);

module.exports = router;
