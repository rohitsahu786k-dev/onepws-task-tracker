const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const webhookCtrl = require('../controllers/webhook.controller');
const deliveryCtrl = require('../controllers/webhookDelivery.controller');

router.use(protect);
router.use((req, res, next) => (req.params.wid ? verifyWorkspaceAccess(req, res, next) : next()));

// Developer settings
router.get('/event-catalog', webhookCtrl.getEventCatalog);
router.get('/activity', deliveryCtrl.getDeveloperActivity);

module.exports = router;
