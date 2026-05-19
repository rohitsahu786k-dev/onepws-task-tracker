const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/dashboard.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('dashboard'));

router.get('/', ctrl.getDashboard);
router.get('/layout', ctrl.getLayout);
router.put('/layout', ctrl.updateLayout);
router.post('/layout/reset', ctrl.resetLayout);
router.get('/widgets', ctrl.listWidgets);
router.get('/widgets/:widgetKey', ctrl.getWidget);
router.get('/widgets/:widgetKey/data', ctrl.getWidgetData);
router.get('/summary', ctrl.summary);
router.get('/activity', (_req, res) => res.json({ success: true, data: [] }));
router.get('/quick-actions', (req, res, next) => {
  req.params.widgetKey = 'quick_actions';
  return ctrl.getWidgetData(req, res, next);
});
router.get('/preferences', ctrl.getPreferences);
router.put('/preferences', ctrl.updatePreferences);
router.post('/widgets/:widgetKey/add', ctrl.getWidget);
router.patch('/widgets/:widgetKey/hide', ctrl.getLayout);
router.patch('/widgets/:widgetKey/show', ctrl.getLayout);
router.patch('/widgets/:widgetKey/config', ctrl.getLayout);

module.exports = router;
