const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/employeeSkill.controller');

router.use(protect, verifyWorkspaceAccess);

router.get('/', ctrl.list);
router.post('/:employeeId/skills', ctrl.create);
router.put('/:employeeId/skills/:skillId', ctrl.update);
router.delete('/:employeeId/skills/:skillId', ctrl.remove);

module.exports = router;
