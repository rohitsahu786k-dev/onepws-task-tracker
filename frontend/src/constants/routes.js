export const ROUTES = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  GOOGLE_SUCCESS: '/auth/google/success',

  // App
  DASHBOARD: '/dashboard',
  ONBOARDING: '/onboarding',

  // Workspaces
  WORKSPACES: '/workspaces',
  CREATE_WORKSPACE: '/workspaces/create',
  WORKSPACE_SETTINGS: '/workspaces/settings',
  WORKSPACE_MEMBERS: '/workspaces/members',

  // Departments
  DEPARTMENTS: '/departments',

  // Projects
  PROJECTS: '/projects',
  CREATE_PROJECT: '/projects/create',
  PROJECT_DETAIL: (id) => `/projects/${id}`,
  PROJECT_ARCHIVE: '/projects/archive',

  // Tasks
  ALL_TASKS: '/tasks',
  MY_TASKS: '/tasks/mine',
  OVERDUE_TASKS: '/tasks/overdue',
  TASK_DETAIL: (id) => `/tasks/${id}`,
  TASK_STAGES: '/tasks/stages',
  TASK_TEMPLATES: '/tasks/templates',
  GANTT: '/tasks/gantt',

  // Tracker
  DAILY_TRACKER: '/tracker',
  TRACKER_CONFIG: '/tracker/config',

  // Timesheets
  MY_TIMESHEET: '/timesheets/mine',
  ALL_TIMESHEETS: '/timesheets',
  TIMESHEET_APPROVAL: '/timesheets/approval',

  // Budget
  BUDGET_DASHBOARD: '/budget',
  BUDGET_LIST: '/budget/list',
  BUDGET_DETAIL: (id) => `/budget/${id}`,
  CREATE_BUDGET: '/budget/create',
  EXPENSES: '/budget/expenses',

  // SLA
  SLA_DASHBOARD: '/sla',
  SLA_CONFIG: '/sla/config',
  SLA_REPORT: '/sla/report',

  // Intake
  INTAKE_SELECT: '/intake',
  INTAKE_FILL: '/intake/fill',
  INTAKE_LIST: '/intake/list',
  INTAKE_REVIEW: '/intake/review',

  // Approvals
  PENDING_APPROVALS: '/approvals',
  APPROVAL_CHAIN_CONFIG: '/approvals/chains',

  // Reports
  REPORTS: '/reports',
  PROJECT_REPORT: '/reports/projects',
  TASK_REPORT: '/reports/tasks',
  TRACKER_REPORT: '/reports/tracker',
  USER_REPORT: '/reports/users',
  DEPT_REPORT: '/reports/departments',
  BUDGET_REPORT: '/reports/budget',

  // Notes
  NOTES: '/notes',
  NOTE_EDITOR: (id) => `/notes/${id}`,

  // Calendar
  CALENDAR: '/calendar',

  // Media
  MEDIA: '/media',

  // MOM
  MOMS: '/mom',
  CREATE_MOM: '/mom/create',
  MOM_DETAIL: (id) => `/mom/${id}`,

  // Meetings
  MEETINGS: '/meetings',
  CREATE_MEETING: '/meetings/create',
  MEETING_DETAIL: (id) => `/meetings/${id}`,

  // Wiki
  WIKI: '/wiki',
  WIKI_PAGE: (slug) => `/wiki/${slug}`,
  WIKI_EDITOR: (slug) => `/wiki/${slug}/edit`,

  // Other
  ANNOUNCEMENTS: '/announcements',
  VENDORS: '/vendors',
  VENDOR_DETAIL: (id) => `/vendors/${id}`,
  SPRINT_LIST: '/sprint',
  SPRINT_BOARD: (id) => `/sprint/${id}`,
  CONTENT_CALENDAR: '/content-calendar',
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAIL: (id) => `/campaigns/${id}`,
  ACTIVITY_LOG: '/activity-log',
  DIRECTORY: '/directory',

  // Profile
  MY_PROFILE: '/profile',
  EDIT_PROFILE: '/profile/edit',
  SECURITY: '/profile/security',
  NOTIFICATION_PREFS: '/profile/notifications',

  // Settings
  SETTINGS: '/settings',
  HELP: '/help',

  // Errors
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
};
