const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/user.controller');

router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);
router.post('/me/avatar', protect, ctrl.uploadAvatar);
router.delete('/me/avatar', protect, ctrl.deleteAvatar);
router.get('/', protect, ctrl.getAll);
router.post('/', protect, ctrl.create);
router.get('/:id', protect, ctrl.getById);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
