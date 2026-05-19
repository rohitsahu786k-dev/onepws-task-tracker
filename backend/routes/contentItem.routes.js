const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/contentItem.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('content_calendar'));

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:contentId', ctrl.getById);
router.put('/:contentId', ctrl.update);
router.delete('/:contentId', ctrl.remove);

router.patch('/:contentId/status', ctrl.updateStatus);
router.post('/:contentId/submit-approval', ctrl.updateStatus);
router.patch('/:contentId/schedule', ctrl.schedule);
router.patch('/:contentId/publish', ctrl.publish);
router.patch('/:contentId/cancel', (req, _res, next) => { req.body.status = 'cancelled'; next(); }, ctrl.updateStatus);
router.patch('/:contentId/archive', (req, _res, next) => { req.body.status = 'archived'; next(); }, ctrl.updateStatus);
router.patch('/:contentId/restore', (req, _res, next) => { req.body.status = 'idea'; next(); }, ctrl.updateStatus);

router.patch('/:contentId/performance', ctrl.updatePerformance);
router.get('/:contentId/performance', ctrl.getPerformance);
router.get('/:contentId/activity', (_req, res) => res.json({ success: true, data: [] }));

module.exports = router;
