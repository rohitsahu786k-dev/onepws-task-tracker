/**
 * Enhanced Task Controller - Complete Button Logic Implementation
 * Handles: Create Task, Update Task, Task Listing with Filters
 */

const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const TaskAttachment = require('../models/TaskAttachment');
const TaskHistory = require('../models/TaskHistory');
const SLATracker = require('../models/SLATracker');
const SLAConfig = require('../models/SLAConfig');
const CalendarEvent = require('../models/CalendarEvent');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { syncTaskEvent } = require('../services/calendar.service');
const notificationService = require('../services/notification.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Counter = require('../models/Counter');

/**
 * Generate unique task number: MKT-2026-0043
 */
const generateTaskNumber = asyncHandler(async (workspaceId) => {
  const currentYear = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, name: 'taskNumber', year: currentYear },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  
  const paddedNumber = String(counter.value).padStart(4, '0');
  return `MKT-${currentYear}-${paddedNumber}`;
});

/**
 * CREATE TASK - Complete Implementation
 * POST /api/workspaces/:wid/tasks
 * 
 * Frontend sends:
 * {
 *   title, description, projectId, stageId,
 *   assignedTo: [...], priority, dueDate,
 *   estimatedHours, slaDeliverableType, tags,
 *   tempAttachments: [tempFileIds]
 * }
 */
const createTask = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const {
    title, description, projectId, stageId, assignedTo,
    priority, dueDate, estimatedHours, slaDeliverableType,
    tags, tempAttachments
  } = req.body;

  // 1. VALIDATION
  if (!title || !projectId || !stageId) {
    throw new ApiError(400, "Title, Project, and Stage are required");
  }

  // 2. GENERATE TASK NUMBER
  const taskNumber = await generateTaskNumber(wid);

  // 3. CREATE TASK DOCUMENT
  const taskData = {
    workspace: wid,
    taskNumber,
    title,
    description,
    project: projectId,
    stage: stageId,
    assignedTo: assignedTo || [],
    priority: priority || 'medium',
    dueDate,
    estimatedHours,
    tags: tags || [],
    createdBy: req.user._id,
    updatedBy: req.user._id
  };

  const task = await Task.create(taskData);

  // 4. HANDLE ATTACHMENTS - Move from temp to permanent
  if (tempAttachments && tempAttachments.length > 0) {
    const attachmentRecords = await TaskAttachment.insertMany(
      tempAttachments.map(tempId => ({
        task: task._id,
        tempFileId: tempId,
        uploadedBy: req.user._id,
        workspace: wid
      }))
    );
    task.attachments = attachmentRecords.map(a => a._id);
    await task.save();
  }

  // 5. CALCULATE AND CREATE SLA TRACKER
  if (slaDeliverableType) {
    const slaConfig = await SLAConfig.findOne({
      workspace: wid,
      deliverableType: slaDeliverableType
    });

    if (slaConfig) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const slaTracker = await SLATracker.create({
        workspace: wid,
        task: task._id,
        deliverableType: slaDeliverableType,
        createdAt: today,
        phases: [
          {
            phase: '1st_draft',
            deadline: new Date(today.getTime() + slaConfig.firstDraftDays * 24 * 60 * 60 * 1000),
            status: 'pending'
          },
          {
            phase: 'final_delivery',
            deadline: new Date(today.getTime() + (slaConfig.firstDraftDays + slaConfig.deliveryDays) * 24 * 60 * 60 * 1000),
            status: 'pending'
          }
        ]
      });

      task.slaTracker = slaTracker._id;
      await task.save();
    }
  }

  // 6. CREATE CALENDAR EVENT if due date exists
  if (dueDate) {
    const calendarEvent = await CalendarEvent.create({
      workspace: wid,
      title: `Task: ${title}`,
      type: 'Task',
      startDate: dueDate,
      endDate: dueDate,
      description: description || '',
      refId: task._id,
      refModel: 'Task',
      attendees: assignedTo || [],
      color: '#D32F2F'
    });
    task.calendarEvent = calendarEvent._id;
    await task.save();
  }

  // 7. SEND NOTIFICATIONS (task_assigned)
  // Recipients per spec: assigned users + watchers + project manager
  if (assignedTo && assignedTo.length > 0) {
    const assignedUsers = assignedTo.filter(Boolean);

    // Best-effort fetch watchers + project manager (if those fields exist on Project/Task models)
    // If project manager/watchers are not available, falls back to assigned users only.
    const project = await Task.findById(task._id).select('project').populate('project');
    const projectManagerId =
      project?.project?.projectManager?._id ||
      project?.project?.projectManager ||
      project?.project?.manager;

    const watchers =
      task.watchers ||
      project?.project?.watchers ||
      project?.project?.watchersList ||
      [];

    const watcherIds = Array.isArray(watchers) ? watchers.filter(Boolean) : [];

    const allRecipients = Array.from(
      new Set([
        ...assignedUsers.map(String),
        ...(watcherIds || []).map(String),
        projectManagerId ? String(projectManagerId) : null
      ].filter(Boolean))
    );

    await notificationService.notify({
      workspace: wid,
      recipients: allRecipients,
      sender: req.user._id,
      type: 'task_assigned',
      title: `New Task: ${title}`,
      message: `You have been assigned to "${title}"`,
      refModel: 'Task',
      refId: task._id,
      actionUrl: `/tasks/${task._id}`,
      priority: taskData.priority,
      channels: { inApp: true, email: true },
      metadata: {
        taskNumber: taskNumber,
        taskTitle: title,
        dueDate: dueDate || null,
        priority: taskData.priority,
        projectName: project?.project?.title || undefined
      }
    });
  }

  // 8. CREATE ACTIVITY LOG
  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'task_created',
    refId: task._id,
    refModel: 'Task',
    meta: {
      title,
      project: projectId,
      stage: stageId,
      assignedCount: (assignedTo || []).length
    }
  });

  // 9. Populate and return
  const populatedTask = await Task.findById(task._id)
    .populate('project', 'title')
    .populate('stage', 'name color')
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('attachments')
    .lean();

  // 10. SOCKET EMIT - notify all workspace members
  // io.to(`workspace:${wid}`).emit('task_created', populatedTask);

  return res.status(201).json(
    new ApiResponse(201, populatedTask, 'Task created successfully')
  );
});

/**
 * GET ALL TASKS with Filters & Pagination
 * GET /api/workspaces/:wid/tasks?projectId=&stageId=&priority=&search=
 */
const getAllTasks = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { projectId, stageId, priority, assignedTo, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  const filter = { workspace: wid };

  // Apply filters
  if (projectId) filter.project = projectId;
  if (stageId) filter.stage = stageId;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = { $in: Array.isArray(assignedTo) ? assignedTo : [assignedTo] };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { taskNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Apply role-based access control
  if (req.workspaceRole === 'member') {
    filter.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
      { watchers: req.user._id }
    ];
  }

  // Count total
  const total = await Task.countDocuments(filter);

  // Fetch with pagination
  const tasks = await Task.find(filter)
    .populate('project', 'title')
    .populate('stage', 'name color')
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  // Add isOverdue flag
  const tasksWithOverdue = tasks.map(task => ({
    ...task,
    isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'closed'
  }));

  return res.json(
    new ApiResponse(200, {
      tasks: tasksWithOverdue,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    })
  );
});

/**
 * UPDATE TASK
 */
const updateTask = asyncHandler(async (req, res) => {
  const { wid, id } = req.params;
  const updateData = req.body;

  // Don't allow updating these fields
  delete updateData.taskNumber;
  delete updateData.createdBy;
  delete updateData.workspace;

  updateData.updatedBy = req.user._id;

  const task = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('project', 'title')
    .populate('stage', 'name color')
    .populate('assignedTo', 'name email avatar')
    .lean();

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Sync calendar event if task changed
  await syncTaskEvent(task);

  // Create activity log
  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'task_updated',
    refId: task._id,
    refModel: 'Task'
  });

  return res.json(new ApiResponse(200, task, 'Task updated successfully'));
});

/**
 * GET TASK BY ID (with full details)
 */
const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id)
    .populate('project')
    .populate('stage')
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('attachments')
    .populate('slaTracker')
    .populate('calendarEvent')
    .lean();

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  return res.json(new ApiResponse(200, task, 'Task retrieved'));
});

/**
 * DELETE TASK
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { wid, id } = req.params;

  const task = await Task.findByIdAndDelete(id);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Delete related records
  await TaskAttachment.deleteMany({ task: id });
  await SLATracker.deleteMany({ task: id });
  if (task.calendarEvent) {
    await CalendarEvent.findByIdAndDelete(task.calendarEvent);
  }

  // Activity log
  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'task_deleted',
    meta: { taskNumber: task.taskNumber, title: task.title }
  });

  return res.json(new ApiResponse(200, null, 'Task deleted successfully'));
});

module.exports = {
  createTask,
  getAllTasks,
  updateTask,
  getTaskById,
  deleteTask
};
