const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/department.controller');

const workspaceAccess = [protect, verifyWorkspaceAccess];

router.get('/', workspaceAccess, ctrl.getAll);
router.post('/', workspaceAccess, ctrl.create);
router.get('/:departmentId', workspaceAccess, ctrl.getById);
router.put('/:departmentId', workspaceAccess, ctrl.update);
router.delete('/:departmentId', workspaceAccess, ctrl.remove);
router.patch('/:departmentId/activate', workspaceAccess, ctrl.activate);
router.patch('/:departmentId/deactivate', workspaceAccess, ctrl.deactivate);
router.patch('/:departmentId/restore', workspaceAccess, ctrl.restore);
router.patch('/:departmentId/modules', workspaceAccess, ctrl.setModules);
router.get('/tree', workspaceAccess, ctrl.tree);
router.get('/:departmentId/members', workspaceAccess, ctrl.listMembers);
router.post('/:departmentId/members', workspaceAccess, ctrl.addMember);
router.delete('/:departmentId/members/:userId', workspaceAccess, ctrl.removeMember);
router.patch('/:departmentId/head', workspaceAccess, ctrl.setHead);
router.get('/:departmentId/employees', workspaceAccess, ctrl.employees);
router.get('/:departmentId/tasks', workspaceAccess, ctrl.getTasks);
router.get('/:departmentId/reports', workspaceAccess, ctrl.getReports);
router.get('/:departmentId/dashboard', workspaceAccess, ctrl.getDashboard);

module.exports = router;
