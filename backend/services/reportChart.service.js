const dayjs = require('dayjs');

function groupCount(items, getter, fallback = 'Unknown') {
  const map = {};
  items.forEach((item) => {
    const raw = getter(item);
    const name = raw?.name || raw?.title || raw?.code || raw || fallback;
    map[name] = (map[name] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function buildMonthlyTrend(items, receivedGetter, completedGetter) {
  const map = {};
  items.forEach((item) => {
    const key = dayjs(receivedGetter(item) || item.createdAt).format('MMM YYYY');
    map[key] = map[key] || { month: key, received: 0, completed: 0 };
    map[key].received += 1;
    if (completedGetter(item)) map[key].completed += 1;
  });
  return Object.values(map);
}

function buildTrackerCharts(rows) {
  return {
    tasksByStatus: groupCount(rows, (row) => row.rowData?.final_status || row.status),
    onTimeVsDelayed: [
      { name: 'On Time', value: rows.filter((row) => String(row.calculatedData?.delay_in_time || '').toLowerCase() === 'on time').length },
      { name: 'Delayed', value: rows.filter((row) => String(row.calculatedData?.delay_in_time || '').toLowerCase().includes('delayed')).length }
    ],
    tasksByUser: groupCount(rows, (row) => row.rowData?.task_handled_by_name || row.rowData?.task_handled_by),
    tasksByType: groupCount(rows, (row) => row.rowData?.type_of_task),
    tasksByDepartment: groupCount(rows, (row) => row.rowData?.task_given_by_department_name || row.rowData?.task_given_by_department),
    productWiseCount: groupCount(rows, (row) => row.rowData?.type_of_product),
    monthlyTrend: buildMonthlyTrend(rows, (row) => row.rowData?.task_receipt_date || row.createdAt, (row) => row.rowData?.final_status === 'submitted')
  };
}

function buildTaskCharts(tasks) {
  return {
    tasksByStatus: groupCount(tasks, (task) => task.status),
    tasksByPriority: groupCount(tasks, (task) => task.priority),
    tasksByStage: groupCount(tasks, (task) => task.stage?.name || task.stage?.title),
    tasksByUser: groupCount(tasks, (task) => task.handledBy?.name || task.assignedTo?.[0]?.name),
    tasksByDepartment: groupCount(tasks, (task) => task.requestedByDepartment?.name),
    tasksByType: groupCount(tasks, (task) => task.taskCategory || task.deliverableType),
    onTimeVsDelayed: [
      { name: 'On Time', value: tasks.filter((task) => ['on_time', 'early'].includes(task.delayStatus)).length },
      { name: 'Delayed', value: tasks.filter((task) => task.delayStatus === 'delayed' || Number(task.delayInDays || 0) > 0).length }
    ],
    monthlyTrend: buildMonthlyTrend(tasks, (task) => task.createdAt, (task) => ['closed', 'completed'].includes(task.status))
  };
}

function buildSlaCharts(slas) {
  return {
    slaStatusDistribution: groupCount(slas, (sla) => sla.overallStatus),
    deliverableWiseDelay: groupCount(slas, (sla) => sla.task?.deliverableType || sla.task?.taskCategory),
    departmentWiseSlaBreach: groupCount(slas.filter((sla) => sla.overallStatus === 'breached'), (sla) => sla.task?.requestedByDepartment?.name),
    monthlySlaComplianceTrend: buildMonthlyTrend(slas, (sla) => sla.t0Date || sla.createdAt, (sla) => sla.overallStatus === 'completed')
  };
}

function buildBudgetCharts(budgets, expenses = []) {
  return {
    budgetUtilization: [
      { name: 'Allocated', value: budgets.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0) },
      { name: 'Spent', value: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) }
    ],
    categoryWiseExpense: groupCount(expenses, (item) => item.category?.name || item.category?.title),
    vendorWiseExpense: groupCount(expenses, (item) => item.vendor?.name),
    projectWiseBudgetUsage: groupCount(budgets, (item) => item.project?.title || item.project?.name),
    monthlySpendingTrend: buildMonthlyTrend(expenses, (item) => item.paymentDate || item.createdAt, () => true)
  };
}

module.exports = {
  groupCount,
  buildTrackerCharts,
  buildTaskCharts,
  buildSlaCharts,
  buildBudgetCharts
};
