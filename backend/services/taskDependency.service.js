const Task = require('../models/Task');

async function hasCircularDependency(workspace, taskId, dependencyTaskId, visited = new Set()) {
  const currentId = String(dependencyTaskId);
  if (currentId === String(taskId)) return true;
  if (visited.has(currentId)) return false;
  visited.add(currentId);

  const dependency = await Task.findOne({ _id: dependencyTaskId, workspace, isDeleted: { $ne: true } }).select('dependencies');
  if (!dependency) return false;

  for (const item of dependency.dependencies || []) {
    if (await hasCircularDependency(workspace, taskId, item.task, visited)) return true;
  }
  return false;
}

async function hasOpenBlockingDependencies(task) {
  const blockedBy = (task.dependencies || []).filter((item) => item.type === 'blocked_by').map((item) => item.task);
  if (!blockedBy.length) return false;

  const openCount = await Task.countDocuments({
    _id: { $in: blockedBy },
    workspace: task.workspace,
    status: { $nin: ['closed', 'cancelled'] },
    isDeleted: { $ne: true },
  });

  return openCount > 0;
}

module.exports = {
  hasCircularDependency,
  hasOpenBlockingDependencies,
};
