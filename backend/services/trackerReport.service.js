const dayjs = require('dayjs');
const TrackerRow = require('../models/TrackerRow');

const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
};

const normalizeRows = (rows) => rows.map((row) => ({
  ...row.toObject?.() || row,
  rowData: mapToObject(row.rowData),
  calculatedData: mapToObject(row.calculatedData),
}));

const buildDateFilter = ({ from, to } = {}) => {
  if (!from && !to) return null;
  const filter = {};
  if (from) filter.$gte = dayjs(from).startOf('day').toDate();
  if (to) filter.$lte = dayjs(to).endOf('day').toDate();
  return filter;
};

const getTrackerRowsForReport = async (workspaceId, filters = {}) => {
  const query = { workspace: workspaceId, isDeleted: { $ne: true } };
  const createdAt = buildDateFilter(filters);
  if (createdAt) query.createdAt = createdAt;

  const rows = await TrackerRow.find(query).sort({ rowNumber: 1 }).lean();
  return normalizeRows(rows);
};

const getSummaryReport = async (workspaceId, filters = {}) => {
  const rows = await getTrackerRowsForReport(workspaceId, filters);
  const total = rows.length;
  let pending = 0;
  let submitted = 0;
  let delayed = 0;
  let onTime = 0;
  let totalDelay = 0;
  let delayedWithDays = 0;
  let dueToday = 0;
  let dueTomorrow = 0;
  const byStatus = {};
  const byType = {};
  const byDepartment = {};
  const byHandledBy = {};

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

  rows.forEach((row) => {
    const rowData = row.rowData || {};
    const calculatedData = row.calculatedData || {};
    const status = rowData.final_status || row.status || 'pending';
    const delayDays = Number(calculatedData.delay_in_task_closure || 0);
    const delayStatus = String(calculatedData.delay_in_time || '');
    const dueDate = calculatedData.my_target_due_date;

    byStatus[status] = (byStatus[status] || 0) + 1;
    if (rowData.type_of_task) byType[rowData.type_of_task] = (byType[rowData.type_of_task] || 0) + 1;
    if (rowData.task_given_by_department) byDepartment[rowData.task_given_by_department] = (byDepartment[rowData.task_given_by_department] || 0) + 1;
    if (rowData.task_handled_by) byHandledBy[rowData.task_handled_by] = (byHandledBy[rowData.task_handled_by] || 0) + 1;

    if (status === 'submitted' || status === 'closed') submitted += 1;
    else pending += 1;

    if (delayDays > 0 || delayStatus.includes('Delayed')) {
      delayed += 1;
      totalDelay += delayDays;
      delayedWithDays += 1;
    }
    if (delayStatus.includes('On Time') || delayStatus.includes('Early')) onTime += 1;
    if (dueDate === today) dueToday += 1;
    if (dueDate === tomorrow) dueTomorrow += 1;
  });

  return {
    totalTasks: total,
    pendingTasks: pending,
    submittedTasks: submitted,
    delayedTasks: delayed,
    onTimeTasks: onTime,
    onTimePercentage: total ? Math.round((onTime / total) * 100) : 0,
    averageDelay: delayedWithDays ? Number((totalDelay / delayedWithDays).toFixed(1)) : 0,
    tasksDueToday: dueToday,
    tasksDueTomorrow: dueTomorrow,
    byStatus,
    byType,
    byDepartment,
    byHandledBy,
  };
};

module.exports = {
  getSummaryReport,
  getTrackerRowsForReport,
};
