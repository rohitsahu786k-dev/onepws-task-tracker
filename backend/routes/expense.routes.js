const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/expense.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('expenses'));

router.get('/my', checkPermission('expenses', 'view'), ctrl.my);
router.get('/pending-approvals', checkPermission('expenses', 'view'), ctrl.pendingApprovals);
router.get('/payment-due', checkPermission('expenses', 'view'), ctrl.paymentDue);
router.get('/overdue-payments', checkPermission('expenses', 'view'), ctrl.overduePayments);
router.get('/reports', checkPermission('expenses', 'view'), ctrl.reports);
router.post('/reports/export/:format', checkPermission('expenses', 'view'), ctrl.exportReports);

router.get('/', checkPermission('expenses', 'view'), ctrl.getAll);
router.post('/', checkPermission('expenses', 'create'), ctrl.create);
router.get('/:expenseId', checkPermission('expenses', 'view'), ctrl.getById);
router.put('/:expenseId', checkPermission('expenses', 'update'), ctrl.update);
router.delete('/:expenseId', checkPermission('expenses', 'delete'), ctrl.remove);

router.post('/:expenseId/submit-approval', checkPermission('expenses', 'update'), ctrl.submitApproval);
router.patch('/:expenseId/approve', checkPermission('expenses', 'approve'), ctrl.approve);
router.patch('/:expenseId/reject', checkPermission('expenses', 'approve'), ctrl.reject);
router.patch('/:expenseId/cancel', checkPermission('expenses', 'update'), ctrl.cancel);
router.patch('/:expenseId/archive', checkPermission('expenses', 'update'), ctrl.archive);
router.patch('/:expenseId/restore', checkPermission('expenses', 'delete'), ctrl.restore);

router.post('/:expenseId/receipts', checkPermission('expenses', 'update'), ctrl.addReceipt);
router.get('/:expenseId/receipts', checkPermission('expenses', 'view'), ctrl.listReceipts);
router.delete('/:expenseId/receipts/:receiptId', checkPermission('expenses', 'update'), ctrl.deleteReceipt);

router.post('/:expenseId/payments', checkPermission('expenses', 'approve'), ctrl.recordPayment);
router.get('/:expenseId/payments', checkPermission('expenses', 'view'), ctrl.listPayments);
router.get('/:expenseId/activity', checkPermission('expenses', 'view'), ctrl.activity);

module.exports = router;
