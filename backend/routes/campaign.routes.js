const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/campaign.controller');
const contentCtrl = require('../controllers/contentItem.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('campaigns'));

router.get('/dashboard', ctrl.dashboard);
router.get('/reports', ctrl.reports);
router.post('/reports/export/:format', ctrl.reports);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:campaignId', ctrl.getById);
router.put('/:campaignId', ctrl.update);
router.delete('/:campaignId', ctrl.remove);

router.patch('/:campaignId/plan', ctrl.plan);
router.patch('/:campaignId/start', ctrl.start);
router.patch('/:campaignId/hold', ctrl.hold);
router.patch('/:campaignId/complete', ctrl.complete);
router.patch('/:campaignId/cancel', ctrl.cancel);
router.patch('/:campaignId/archive', ctrl.archive);
router.patch('/:campaignId/restore', ctrl.restore);

router.get('/:campaignId/content-items', ctrl.listContentItems);
router.post('/:campaignId/content-items', (req, _res, next) => {
  req.body.campaign = req.params.campaignId;
  next();
}, contentCtrl.create);

router.get('/:campaignId/performance', ctrl.performance);
router.patch('/:campaignId/performance/recalculate', ctrl.performance);
router.get('/:campaignId/activity', (_req, res) => res.json({ success: true, data: [] }));
router.get('/:campaignId/report', ctrl.report);

module.exports = router;
