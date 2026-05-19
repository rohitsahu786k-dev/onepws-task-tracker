const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const deliveryCtrl = require('../controllers/webhookDelivery.controller');
const webhookCtrl = require('../controllers/webhook.controller');

router.use(protect);
router.use((req, res, next) => (req.params.wid ? verifyWorkspaceAccess(req, res, next) : next()));

// Webhook deliveries
router.get('/', deliveryCtrl.listDeliveries);
router.post('/retry-failed', deliveryCtrl.retryAllFailed);
router.get('/:deliveryId', deliveryCtrl.getDelivery);
router.post('/:deliveryId/retry', deliveryCtrl.retryDelivery);

module.exports = router;
