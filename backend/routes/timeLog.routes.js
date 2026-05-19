const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/timeLog.controller');

router.use(protect);
router.use((req, res, next) => (req.params.wid ? verifyWorkspaceAccess(req, res, next) : next()));

router.get('/my', ctrl.myLogs);
router.get('/team', ctrl.list);
router.get('/by-task/:task', ctrl.list);
router.get('/by-project/:project', ctrl.list);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:timeLogId', ctrl.getById);
router.put('/:timeLogId', ctrl.update);
router.delete('/:timeLogId', ctrl.remove);

module.exports = router;
