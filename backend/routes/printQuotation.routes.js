const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/printQuotation.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('print_jobs'));

router.get('/', ctrl.list);
router.get('/:quotationId', ctrl.getById);
router.put('/:quotationId', ctrl.update);
router.delete('/:quotationId', ctrl.remove);
router.patch('/:quotationId/select', ctrl.select);
router.patch('/:quotationId/reject', ctrl.reject);
router.patch('/:quotationId/expire', ctrl.expire);

module.exports = router;
