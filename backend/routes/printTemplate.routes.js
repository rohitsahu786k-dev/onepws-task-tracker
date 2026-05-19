const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/printTemplate.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('print_jobs'));

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);

module.exports = router;
