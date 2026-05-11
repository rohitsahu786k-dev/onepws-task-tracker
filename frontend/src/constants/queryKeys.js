// React Query cache key constants — prevents magic string duplication
export const QUERY_KEYS = {
  // Auth
  ME: ['me'],

  // Users
  USERS: ['users'],
  USER: (id) => ['users', id],

  // Workspaces
  WORKSPACES: ['workspaces'],
  WORKSPACE: (id) => ['workspaces', id],
  WORKSPACE_MEMBERS: (id) => ['workspaces', id, 'members'],

  // Departments
  DEPARTMENTS: ['departments'],
  DEPARTMENT: (id) => ['departments', id],

  // Projects
  PROJECTS: ['projects'],
  PROJECT: (id) => ['projects', id],
  PROJECT_TASKS: (id) => ['projects', id, 'tasks'],

  // Tasks
  TASKS: ['tasks'],
  TASK: (id) => ['tasks', id],
  MY_TASKS: ['tasks', 'mine'],
  OVERDUE_TASKS: ['tasks', 'overdue'],
  TASK_COMMENTS: (id) => ['tasks', id, 'comments'],
  TASK_ATTACHMENTS: (id) => ['tasks', id, 'attachments'],
  TASK_HISTORY: (id) => ['tasks', id, 'history'],
  TASK_STAGES: ['task-stages'],
  TASK_TEMPLATES: ['task-templates'],

  // Tracker
  TRACKER_CONFIG: ['tracker', 'config'],
  TRACKER_ROWS: ['tracker', 'rows'],

  // Timesheets
  MY_TIMESHEET: ['timesheets', 'mine'],
  ALL_TIMESHEETS: ['timesheets'],

  // Budget
  BUDGETS: ['budgets'],
  BUDGET: (id) => ['budgets', id],
  EXPENSES: ['expenses'],

  // SLA
  SLA_CONFIGS: ['sla', 'configs'],
  SLA_TRACKERS: ['sla', 'trackers'],

  // Calendar
  CALENDAR_EVENTS: ['calendar', 'events'],
  HOLIDAYS: ['holidays'],

  // Media
  MEDIA_FILES: ['media'],
  MEDIA_FOLDERS: ['media', 'folders'],

  // Notes
  NOTES: ['notes'],
  NOTE: (id) => ['notes', id],

  // MOM
  MOMS: ['moms'],
  MOM: (id) => ['moms', id],

  // Meetings
  MEETINGS: ['meetings'],
  MEETING: (id) => ['meetings', id],

  // Notifications
  NOTIFICATIONS: ['notifications'],
  UNREAD_COUNT: ['notifications', 'unread'],

  // Wiki
  WIKI_PAGES: ['wiki'],
  WIKI_PAGE: (slug) => ['wiki', slug],

  // Announcements
  ANNOUNCEMENTS: ['announcements'],

  // Vendors
  VENDORS: ['vendors'],
  VENDOR: (id) => ['vendors', id],

  // Reports
  REPORTS: ['reports'],

  // Sprint
  SPRINTS: ['sprints'],
  SPRINT: (id) => ['sprints', id],

  // Content Calendar
  CONTENT_POSTS: ['content-calendar'],

  // Campaigns
  CAMPAIGNS: ['campaigns'],
  CAMPAIGN: (id) => ['campaigns', id],

  // Activity Log
  ACTIVITY_LOG: ['activity-log'],

  // Settings
  SETTINGS: ['settings'],
  SYSTEM_SETTINGS: ['settings', 'system'],
};
