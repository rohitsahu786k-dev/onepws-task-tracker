const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/workspace.controller');

router.get('/', protect, ctrl.getAll);
router.post('/', protect, ctrl.create);
router.get('/:id', protect, ctrl.getById);
router.get('/:id/permissions', protect, ctrl.getPermissions);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
