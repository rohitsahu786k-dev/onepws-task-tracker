const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/campaignTemplate.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('campaigns'));

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:templateId', ctrl.getById);
router.put('/:templateId', ctrl.update);
router.delete('/:templateId', ctrl.remove);
router.post('/:templateId/create-campaign', ctrl.createCampaign);
router.post('/:templateId/clone', ctrl.clone);
router.patch('/:templateId/set-default', ctrl.setDefault);

module.exports = router;
