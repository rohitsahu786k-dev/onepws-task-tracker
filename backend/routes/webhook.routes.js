const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/webhook.controller');

router.use(protect);
router.use((req, res, next) => (req.params.wid ? verifyWorkspaceAccess(req, res, next) : next()));

// Webhook CRUD
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:webhookId', ctrl.getById);
router.put('/:webhookId', ctrl.update);
router.delete('/:webhookId', ctrl.remove);

// Status actions
router.patch('/:webhookId/enable', ctrl.enable);
router.patch('/:webhookId/disable', ctrl.disable);
router.patch('/:webhookId/pause', ctrl.pause);

// Test
router.post('/:webhookId/test', ctrl.test);

// Deliveries sub-resource
router.get('/:webhookId/deliveries', ctrl.getDeliveries);

// Event catalog (also accessible here for convenience)
router.get('/meta/event-catalog', ctrl.getEventCatalog);

module.exports = router;
