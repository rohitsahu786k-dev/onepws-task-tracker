const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/sla.controller');

router.use(protect);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.patch('/:id/reset-t0', ctrl.resetT0);
router.delete('/:id', ctrl.remove);

module.exports = router;
