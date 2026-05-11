const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
// const ctrl = require('../controllers/taskTemplate.controller');

// TODO: Add taskTemplate routes
// router.get('/',    protect, ctrl.getAll);
// router.post('/',   protect, ctrl.create);
// router.get('/:id', protect, ctrl.getById);
// router.put('/:id', protect, ctrl.update);
// router.delete('/:id', protect, ctrl.remove);

module.exports = router;
