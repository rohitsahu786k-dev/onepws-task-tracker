const STATUS_COLORS = {
  active: 'emerald',
  approved: 'emerald',
  completed: 'emerald',
  pending: 'amber',
  in_progress: 'blue',
  rejected: 'red',
  overdue: 'red',
  cancelled: 'slate',
  draft: 'slate',
};

export const getColorByStatus = (status = '') => STATUS_COLORS[String(status).toLowerCase()] || 'slate';

export default getColorByStatus;
