const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/holiday.controller');

router.use(protect);

router.get('/', ctrl.getHolidays);
router.post('/', ctrl.createHoliday);
router.get('/:id', ctrl.getHolidayById);
router.put('/:id', ctrl.updateHoliday);
router.delete('/:id', ctrl.deleteHoliday);

module.exports = router;
