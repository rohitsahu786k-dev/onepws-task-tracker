const MODULES = [
  'dashboard',
  'workspace',
  'departments',
  'users',
  'projects',
  'tasks',
  'tracker',
  'timesheets',
  'calendar',
  'media',
  'mom',
  'meetings',
  'sla',
  'intake',
  'budget',
  'expenses',
  'reports',
  'notes',
  'wiki',
  'vendors',
  'campaigns',
  'content_calendar',
  'notifications',
  'email_templates',
  'settings',
  'activity_logs',
  'backup',
  'api_keys'
];

const DEFAULT_ALLOWED_MODULES = MODULES.reduce((acc, moduleKey) => {
  acc[moduleKey] = true;
  return acc;
}, {});

const DEFAULT_ROLE_PERMISSIONS = {
  admin: [
    { module: 'dashboard', actions: ['view'] },
    { module: 'workspace', actions: ['view', 'update'] },
    { module: 'departments', actions: ['view', 'create', 'update', 'delete'] },
    { module: 'users', actions: ['view', 'invite', 'update_role', 'remove'] },
    { module: 'projects', actions: ['view', 'create', 'update', 'delete', 'archive'] },
    { module: 'tasks', actions: ['view', 'create', 'update', 'delete', 'assign', 'comment', 'change_stage'] },
    { module: 'tracker', actions: ['view', 'create_row', 'update_any_row', 'delete_row', 'configure_fields', 'bulk_import', 'bulk_export', 'lock_row', 'unlock_row'] },
    { module: 'calendar', actions: ['view', 'create', 'update', 'delete', 'manage_holidays'] },
    { module: 'media', actions: ['view', 'upload', 'download', 'delete', 'manage_folders'] },
    { module: 'mom', actions: ['view', 'create', 'update', 'delete', 'sign', 'send_for_signature', 'generate_pdf'] },
    { module: 'meetings', actions: ['view', 'create', 'update', 'delete', 'cancel', 'complete', 'create_zoom', 'create_google_meet', 'create_mom'] },
    { module: 'sla', actions: ['view', 'configure', 'reset_t0', 'escalate'] },
    { module: 'intake', actions: ['view', 'review', 'approve', 'reject'] },
    { module: 'budget', actions: ['view', 'create', 'update', 'delete', 'approve'] },
    { module: 'expenses', actions: ['view', 'create', 'update', 'delete', 'approve'] },
    { module: 'reports', actions: ['view', 'view_own', 'view_department', 'export', 'schedule', 'email'] },
    { module: 'notes', actions: ['view', 'create', 'update', 'delete'] },
    { module: 'wiki', actions: ['view', 'create', 'update', 'delete'] },
    { module: 'vendors', actions: ['view', 'create', 'update', 'delete'] },
    { module: 'notifications', actions: ['view', 'manage'] },
    { module: 'email_templates', actions: ['view', 'create', 'update', 'delete'] },
    { module: 'settings', actions: ['view', 'update', 'update_email', 'update_notifications', 'update_roles', 'update_integrations'] },
    { module: 'activity_logs', actions: ['view', 'export'] },
    { module: 'backup', actions: ['view', 'create', 'download'] },
    { module: 'api_keys', actions: ['view', 'create', 'delete'] }
  ],
  manager: [
    { module: 'dashboard', actions: ['view'] },
    { module: 'departments', actions: ['view'] },
    { module: 'users', actions: ['view'] },
    { module: 'projects', actions: ['view', 'create', 'update'] },
    { module: 'tasks', actions: ['view', 'create', 'update', 'assign', 'comment', 'change_stage'] },
    { module: 'tracker', actions: ['view', 'create_row', 'update_department_row', 'bulk_export'] },
    { module: 'calendar', actions: ['view', 'create', 'update'] },
    { module: 'media', actions: ['view', 'upload', 'download'] },
    { module: 'mom', actions: ['view', 'create', 'update', 'sign', 'generate_pdf'] },
    { module: 'meetings', actions: ['view', 'create', 'update', 'cancel', 'complete', 'create_zoom', 'create_google_meet', 'create_mom'] },
    { module: 'sla', actions: ['view'] },
    { module: 'intake', actions: ['view', 'review'] },
    { module: 'budget', actions: ['view'] },
    { module: 'expenses', actions: ['view', 'create'] },
    { module: 'reports', actions: ['view', 'view_department', 'export', 'export_department', 'schedule', 'email'] },
    { module: 'notes', actions: ['view', 'create', 'update'] },
    { module: 'wiki', actions: ['view', 'create', 'update'] },
    { module: 'vendors', actions: ['view'] },
    { module: 'notifications', actions: ['view'] }
  ],
  member: [
    { module: 'dashboard', actions: ['view'] },
    { module: 'projects', actions: ['view'] },
    { module: 'tasks', actions: ['view', 'create', 'update_own', 'update_assigned', 'comment', 'change_own_stage'] },
    { module: 'tracker', actions: ['view', 'create_row', 'update_own_row'] },
    { module: 'calendar', actions: ['view', 'create_own', 'update_own'] },
    { module: 'media', actions: ['view', 'upload', 'download'] },
    { module: 'mom', actions: ['view', 'sign'] },
    { module: 'meetings', actions: ['view', 'create', 'create_own', 'update'] },
    { module: 'sla', actions: ['view_own'] },
    { module: 'intake', actions: ['view_own', 'create'] },
    { module: 'expenses', actions: ['view_own', 'create'] },
    { module: 'reports', actions: ['view', 'view_own'] },
    { module: 'notes', actions: ['view', 'create', 'update_own', 'delete_own'] },
    { module: 'wiki', actions: ['view'] },
    { module: 'notifications', actions: ['view'] }
  ],
  viewer: [
    { module: 'dashboard', actions: ['view'] },
    { module: 'projects', actions: ['view'] },
    { module: 'tasks', actions: ['view'] },
    { module: 'tracker', actions: ['view'] },
    { module: 'calendar', actions: ['view'] },
    { module: 'media', actions: ['view', 'download'] },
    { module: 'mom', actions: ['view'] },
    { module: 'meetings', actions: ['view'] },
    { module: 'sla', actions: ['view'] },
    { module: 'intake', actions: ['view_own'] },
    { module: 'budget', actions: ['view'] },
    { module: 'expenses', actions: ['view'] },
    { module: 'reports', actions: ['view'] },
    { module: 'notes', actions: ['view'] },
    { module: 'wiki', actions: ['view'] },
    { module: 'notifications', actions: ['view'] }
  ]
};

const MODULE_DEPENDENCIES = {
  sla: ['tasks'],
  mom: ['meetings'],
  budget: ['projects'],
  expenses: ['budget'],
  intake: ['tasks'],
  content_calendar: ['calendar', 'tasks']
};

module.exports = {
  MODULES,
  DEFAULT_ALLOWED_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  MODULE_DEPENDENCIES
};
