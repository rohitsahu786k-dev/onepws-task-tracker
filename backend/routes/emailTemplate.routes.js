const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, requireMinimumRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/emailTemplate.controller');

router.use(protect, verifyWorkspaceAccess);

router.get('/', ctrl.getAll);
router.post('/', requireMinimumRole('admin'), ctrl.create);
router.put('/:id', requireMinimumRole('admin'), ctrl.update);
router.delete('/:id', requireMinimumRole('admin'), ctrl.remove);
router.post('/test', requireMinimumRole('admin'), ctrl.sendTest);

module.exports = router;
