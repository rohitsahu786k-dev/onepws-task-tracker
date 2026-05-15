const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/calendar.controller');

router.use(protect);

router.get('/events', ctrl.getEvents);
router.get('/events/range', ctrl.getEvents);
router.get('/my', ctrl.getMyCalendar);
router.get('/team', ctrl.getTeamCalendar);
router.post('/check-conflict', ctrl.checkConflict);
router.get('/reports/summary', ctrl.getSummary);
router.post('/export/excel', ctrl.exportExcel);
router.post('/export/pdf', ctrl.exportPdf);
router.post('/events', ctrl.createEvent);
router.get('/events/:id', ctrl.getEventById);
router.put('/events/:id', ctrl.updateEvent);
router.delete('/events/:id', ctrl.deleteEvent);
router.patch('/events/:id/complete', ctrl.completeEvent);
router.patch('/events/:id/cancel', ctrl.cancelEvent);
router.post('/events/:id/reminders', ctrl.addReminder);
router.delete('/events/:id/reminders/:reminderId', ctrl.removeReminder);

module.exports = router;
