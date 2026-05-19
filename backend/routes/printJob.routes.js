const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/printJob.controller');
const quotationCtrl = require('../controllers/printQuotation.controller');
const proofCtrl = require('../controllers/printProof.controller');
const dispatchCtrl = require('../controllers/printDispatch.controller');
const qualityCtrl = require('../controllers/printQuality.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('print_jobs'));

router.get('/dashboard', ctrl.dashboard);
router.get('/reports', ctrl.reports);
router.post('/reports/export/:format', ctrl.reports);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:printJobId', ctrl.getById);
router.put('/:printJobId', ctrl.update);
router.delete('/:printJobId', ctrl.remove);

router.patch('/:printJobId/status', ctrl.updateStatus);
router.patch('/:printJobId/hold', (req, _res, next) => { req.body.status = 'on_hold'; next(); }, ctrl.updateStatus);
router.patch('/:printJobId/cancel', (req, _res, next) => { req.body.status = 'cancelled'; next(); }, ctrl.updateStatus);
router.patch('/:printJobId/archive', (req, _res, next) => { req.body.status = 'archived'; next(); }, ctrl.updateStatus);
router.patch('/:printJobId/restore', (req, _res, next) => { req.body.status = 'draft'; next(); }, ctrl.updateStatus);

router.post('/:printJobId/artwork', ctrl.uploadArtwork);
router.post('/:printJobId/submit-artwork-approval', ctrl.submitArtworkApproval);
router.post('/:printJobId/submit-print-approval', ctrl.submitPrintApproval);
router.patch('/:printJobId/send-to-vendor', ctrl.sendToVendor);
router.patch('/:printJobId/production-status', ctrl.productionStatus);
router.patch('/:printJobId/ready-for-dispatch', (req, _res, next) => { req.body.status = 'ready_for_dispatch'; next(); }, ctrl.productionStatus);

router.post('/:printJobId/quotations', quotationCtrl.create);
router.get('/:printJobId/quotations', quotationCtrl.list);

router.get('/:printJobId/proofs', proofCtrl.list);
router.post('/:printJobId/proofs', proofCtrl.create);

router.post('/:printJobId/dispatches', dispatchCtrl.create);
router.get('/:printJobId/dispatches', dispatchCtrl.list);

router.post('/:printJobId/quality-check', qualityCtrl.create);
router.patch('/:printJobId/complete', ctrl.complete);
router.post('/:printJobId/create-reprint', ctrl.createReprint);
router.post('/:printJobId/create-expense', (_req, res) => res.status(501).json({ success: false, message: 'Expense integration is not configured yet' }));
router.get('/:printJobId/activity', (_req, res) => res.json({ success: true, data: [] }));
router.get('/:printJobId/report', ctrl.getById);

module.exports = router;
