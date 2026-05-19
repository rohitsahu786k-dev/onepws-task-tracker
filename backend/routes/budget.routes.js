const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/budget.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('budget'));

router.get('/dashboard', checkPermission('budget', 'view'), ctrl.dashboard);
router.get('/reports', checkPermission('budget', 'view'), ctrl.reports);
router.post('/reports/export/:format', checkPermission('budget', 'view'), ctrl.exportReports);

router.get('/', checkPermission('budget', 'view'), ctrl.getAll);
router.post('/', checkPermission('budget', 'create'), ctrl.create);
router.get('/:budgetId', checkPermission('budget', 'view'), ctrl.getById);
router.put('/:budgetId', checkPermission('budget', 'update'), ctrl.update);
router.delete('/:budgetId', checkPermission('budget', 'delete'), ctrl.remove);

router.post('/:budgetId/submit-approval', checkPermission('budget', 'update'), ctrl.submitApproval);
router.patch('/:budgetId/approve', checkPermission('budget', 'approve'), ctrl.approve);
router.patch('/:budgetId/reject', checkPermission('budget', 'approve'), ctrl.reject);
router.patch('/:budgetId/close', checkPermission('budget', 'update'), ctrl.close);
router.patch('/:budgetId/archive', checkPermission('budget', 'update'), ctrl.archive);
router.patch('/:budgetId/restore', checkPermission('budget', 'delete'), ctrl.restore);
router.patch('/:budgetId/recalculate', checkPermission('budget', 'update'), ctrl.recalculate);

router.post('/:budgetId/revisions', checkPermission('budget', 'update'), ctrl.createRevision);
router.get('/:budgetId/revisions', checkPermission('budget', 'view'), ctrl.listRevisions);
router.patch('/:budgetId/revisions/:revisionId/approve', checkPermission('budget', 'approve'), ctrl.approveRevision);
router.patch('/:budgetId/revisions/:revisionId/reject', checkPermission('budget', 'approve'), ctrl.rejectRevision);

router.get('/:budgetId/expenses', checkPermission('budget', 'view'), ctrl.listExpenses);
router.get('/:budgetId/payments', checkPermission('budget', 'view'), ctrl.listPayments);
router.get('/:budgetId/activity', checkPermission('budget', 'view'), ctrl.activity);
router.get('/:budgetId/report', checkPermission('budget', 'view'), ctrl.report);

module.exports = router;
