// ── ROLES ─────────────────────────────────────────────────────────────────────
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
};

const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  employee: 2,
  client: 1,
};

// ── TASK ──────────────────────────────────────────────────────────────────────
const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  DONE: 'done',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
};

const TASK_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// ── SLA ───────────────────────────────────────────────────────────────────────
const SLA_PHASE = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  APPROVED: 'approved',
};

const SLA_STATUS = {
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  BREACHED: 'breached',
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_OVERDUE: 'task_overdue',
  TASK_COMMENTED: 'task_commented',
  TASK_MENTIONED: 'task_mentioned',
  APPROVAL_REQUESTED: 'approval_requested',
  APPROVAL_APPROVED: 'approval_approved',
  APPROVAL_REJECTED: 'approval_rejected',
  SLA_AT_RISK: 'sla_at_risk',
  SLA_BREACHED: 'sla_breached',
  MEETING_REMINDER: 'meeting_reminder',
  TIMESHEET_DUE: 'timesheet_due',
  EXPENSE_APPROVED: 'expense_approved',
  EXPENSE_REJECTED: 'expense_rejected',
  ANNOUNCEMENT: 'announcement',
  SYSTEM: 'system',
};

// ── SOCKET EVENTS ─────────────────────────────────────────────────────────────
const SOCKET_EVENTS = {
  NOTIFICATION: 'notification',
  TASK_UPDATED: 'task:updated',
  TASK_CREATED: 'task:created',
  TASK_DELETED: 'task:deleted',
  COMMENT_ADDED: 'comment:added',
  TIMER_STARTED: 'timer:started',
  TIMER_STOPPED: 'timer:stopped',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
};

// ── FILE TYPES ─────────────────────────────────────────────────────────────────
const FILE_CATEGORY = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  VIDEO: 'video',
  AUDIO: 'audio',
  ARCHIVE: 'archive',
  OTHER: 'other',
};

// ── APPROVAL ──────────────────────────────────────────────────────────────────
const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SKIPPED: 'skipped',
};

// ── TASK NUMBER PREFIX ────────────────────────────────────────────────────────
const TASK_NUMBER_PREFIX = 'MKT';

// ── WORKING DAYS ─────────────────────────────────────────────────────────────
const WORKING_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri (0 = Sun, 6 = Sat)

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  TASK_STATUS,
  TASK_PRIORITY,
  SLA_PHASE,
  SLA_STATUS,
  NOTIFICATION_TYPE,
  SOCKET_EVENTS,
  FILE_CATEGORY,
  APPROVAL_STATUS,
  TASK_NUMBER_PREFIX,
  WORKING_DAYS,
};
