const dayjs = require('dayjs');

const percent = (part, total) => total > 0 ? Number(((part / total) * 100).toFixed(2)) : 0;
const avg = (values) => values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0;

function calculateTrackerSummary(rows) {
  const total = rows.length;
  const submitted = rows.filter((row) => row.rowData?.final_status === 'submitted' || row.status === 'submitted').length;
  const pending = rows.filter((row) => row.rowData?.final_status === 'pending' || row.status === 'pending').length;
  const delayed = rows.filter((row) => String(row.calculatedData?.delay_in_time || row.rowData?.delay_in_time || '').toLowerCase().includes('delayed')).length;
  const onTime = rows.filter((row) => String(row.calculatedData?.delay_in_time || row.rowData?.delay_in_time || '').toLowerCase() === 'on time').length;
  const delayValues = rows.map((row) => Number(row.calculatedData?.delay_in_task_closure || row.rowData?.delay_in_task_closure || 0)).filter((value) => value > 0);

  return {
    total,
    totalTasks: total,
    submitted,
    submittedTasks: submitted,
    pending,
    pendingTasks: pending,
    delayed,
    delayedTasks: delayed,
    onTime,
    onTimeTasks: onTime,
    averageDelay: avg(delayValues),
    averageDelayDays: avg(delayValues),
    completionRate: percent(submitted, total),
    onTimePercentage: percent(onTime, submitted || total)
  };
}

function calculateTaskSummary(tasks) {
  const now = new Date();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => ['closed', 'completed'].includes(task.status) || ['submitted', 'closed'].includes(task.finalStatus)).length;
  const pendingTasks = tasks.filter((task) => !['closed', 'cancelled'].includes(task.status)).length;
  const delayedTasks = tasks.filter((task) => task.delayStatus === 'delayed' || Number(task.delayInDays || 0) > 0).length;
  const onTimeTasks = tasks.filter((task) => ['on_time', 'early'].includes(task.delayStatus)).length;
  const overdueTasks = tasks.filter((task) => !['closed', 'cancelled'].includes(task.status) && task.dueDate && new Date(task.dueDate) < now).length;
  const delayValues = tasks.map((task) => Number(task.delayInDays || 0)).filter((value) => value > 0);

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    delayedTasks,
    onTimeTasks,
    overdueTasks,
    openTasks: tasks.filter((task) => task.status === 'open').length,
    inProcessTasks: tasks.filter((task) => task.status === 'in_process').length,
    submittedTasks: tasks.filter((task) => task.finalStatus === 'submitted').length,
    closedTasks: tasks.filter((task) => task.status === 'closed').length,
    averageDelayDays: avg(delayValues),
    completionRate: percent(completedTasks, totalTasks),
    onTimePercentage: percent(onTimeTasks, completedTasks || totalTasks)
  };
}

function calculateUserPerformance(tasks, timesheets = []) {
  const userMap = new Map();

  tasks.forEach((task) => {
    const assignees = Array.isArray(task.assignedTo) && task.assignedTo.length ? task.assignedTo : [task.handledBy].filter(Boolean);
    assignees.forEach((user) => {
      const id = user?._id?.toString?.() || user?.toString?.();
      if (!id) return;
      const item = userMap.get(id) || {
        userId: id,
        userName: user?.name || 'Unassigned',
        designation: user?.designation || '',
        department: user?.department?.name || '',
        totalAssigned: 0,
        completed: 0,
        pending: 0,
        delayed: 0,
        onTime: 0,
        delayValues: [],
        hoursLogged: 0
      };
      item.totalAssigned += 1;
      if (['closed', 'completed'].includes(task.status) || ['submitted', 'closed'].includes(task.finalStatus)) item.completed += 1;
      if (!['closed', 'cancelled'].includes(task.status)) item.pending += 1;
      if (task.delayStatus === 'delayed' || Number(task.delayInDays || 0) > 0) {
        item.delayed += 1;
        item.delayValues.push(Number(task.delayInDays || 0));
      }
      if (['on_time', 'early'].includes(task.delayStatus)) item.onTime += 1;
      userMap.set(id, item);
    });
  });

  timesheets.forEach((entry) => {
    const id = entry.user?._id?.toString?.() || entry.user?.toString?.();
    if (id && userMap.has(id)) userMap.get(id).hoursLogged += Number(entry.hours || 0);
  });

  return [...userMap.values()].map((item) => ({
    ...item,
    averageDelayDays: avg(item.delayValues),
    completionRate: percent(item.completed, item.totalAssigned),
    onTimeRate: percent(item.onTime, item.completed || item.totalAssigned),
    slaComplianceRate: percent(item.onTime, item.totalAssigned),
    delayValues: undefined
  }));
}

function calculateSlaSummary(slas) {
  const total = slas.length;
  const completed = slas.filter((sla) => sla.overallStatus === 'completed').length;
  const breached = slas.filter((sla) => sla.overallStatus === 'breached').length;
  const delayValues = slas.map((sla) => Number(sla.totalDelayDays || 0)).filter((value) => value > 0);
  return {
    totalSlaTasks: total,
    onTrack: slas.filter((sla) => sla.overallStatus === 'on_track').length,
    atRisk: slas.filter((sla) => sla.overallStatus === 'at_risk').length,
    breached,
    completed,
    averageSlaDelay: avg(delayValues),
    maxDelay: delayValues.length ? Math.max(...delayValues) : 0,
    slaComplianceRate: percent(total - breached, total)
  };
}

function calculateBudgetSummary(budgets, expenses = []) {
  const totalBudget = budgets.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return {
    totalBudgets: budgets.length,
    totalBudget,
    totalExpense,
    approvedExpenses: expenses.filter((item) => item.status === 'approved' || item.status === 'paid').length,
    pendingExpenses: expenses.filter((item) => ['pending', 'submitted'].includes(item.status)).length,
    remainingAmount: totalBudget - totalExpense,
    budgetUtilization: percent(totalExpense, totalBudget)
  };
}

function calculateMeetingSummary(meetings = [], moms = []) {
  const completedMeetings = meetings.filter((meeting) => meeting.status === 'completed').length;
  return {
    totalMeetings: meetings.length,
    completedMeetings,
    cancelledMeetings: meetings.filter((meeting) => meeting.status === 'cancelled').length,
    meetingsWithoutMom: Math.max(completedMeetings - moms.length, 0),
    totalMoms: moms.length,
    meetingConversionRate: percent(moms.length, completedMeetings)
  };
}

function calculateMonthlyManagementSummary({ tasks = [], trackerRows = [], slas = [], budgets = [], expenses = [], meetings = [], moms = [] }) {
  const taskSummary = calculateTaskSummary(tasks);
  const trackerSummary = calculateTrackerSummary(trackerRows);
  const slaSummary = calculateSlaSummary(slas);
  const budgetSummary = calculateBudgetSummary(budgets, expenses);
  const meetingSummary = calculateMeetingSummary(meetings, moms);

  return {
    ...taskSummary,
    totalReceivedWork: trackerRows.length + taskSummary.totalTasks,
    totalCompletedWork: taskSummary.completedTasks + trackerSummary.submitted,
    slaComplianceRate: slaSummary.slaComplianceRate,
    totalBudget: budgetSummary.totalBudget,
    totalExpense: budgetSummary.totalExpense,
    budgetUtilization: budgetSummary.budgetUtilization,
    totalMeetings: meetingSummary.totalMeetings,
    totalMoms: meetingSummary.totalMoms,
    month: dayjs().format('MMMM YYYY')
  };
}

module.exports = {
  calculateTrackerSummary,
  calculateTaskSummary,
  calculateUserPerformance,
  calculateSlaSummary,
  calculateBudgetSummary,
  calculateMeetingSummary,
  calculateMonthlyManagementSummary
};
