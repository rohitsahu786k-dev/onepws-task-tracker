const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/printDispatch.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('print_jobs'));

router.get('/', ctrl.list);
router.get('/:dispatchId', ctrl.getById);
router.put('/:dispatchId', ctrl.update);
router.delete('/:dispatchId', ctrl.remove);
router.patch('/:dispatchId/dispatched', ctrl.dispatched);
router.patch('/:dispatchId/in-transit', ctrl.inTransit);
router.patch('/:dispatchId/delivered', ctrl.delivered);
router.patch('/:dispatchId/failed', ctrl.failed);
router.patch('/:dispatchId/returned', ctrl.returned);

module.exports = router;
