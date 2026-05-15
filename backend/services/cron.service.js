const cron = require('node-cron');
const dayjs = require('dayjs');
const Task = require('../models/Task');
const MOM = require('../models/MOM');
const { notify, notifyOncePerDay } = require('./notification.service');
const { sendCalendarReminders, markOverdueEvents } = require('./calendar.service');

cron.schedule("*/5 * * * *", async () => {
  console.log('Running cron: Calendar Reminders');
  await sendCalendarReminders();
});

// Due Tomorrow (Deadline Approaching)
cron.schedule("0 18 * * *", async () => {
  console.log('Running cron: Tasks Due Tomorrow');
  const tomorrow = dayjs().add(1, "day").startOf("day").toDate();
  const tomorrowEnd = dayjs().add(1, "day").endOf("day").toDate();

  const tasks = await Task.find({
    dueDate: { $gte: tomorrow, $lte: tomorrowEnd },
    status: { $nin: ["closed", "cancelled"] }
  });

  for (const task of tasks) {
      await notifyOncePerDay({
        workspace: task.workspace,
        recipients: task.assignedTo,
        type: "deadline_approaching",
        title: `Deadline Tomorrow: ${task.taskNumber}`,
        message: `${task.title} is due tomorrow.`,
        refModel: "Task",
        refId: task._id,
        actionUrl: `/tasks/${task._id}`,
        channels: { inApp: true, email: true },
        metadata: { taskNumber: task.taskNumber, dueDate: task.dueDate }
      });
  }
});

// Due Today
cron.schedule("0 8 * * *", async () => {
  console.log('Running cron: Tasks Due Today');
  const today = dayjs().startOf("day").toDate();
  const todayEnd = dayjs().endOf("day").toDate();

  const tasks = await Task.find({
    dueDate: { $gte: today, $lte: todayEnd },
    status: { $nin: ["closed", "cancelled"] }
  });

  for (const task of tasks) {
      await notifyOncePerDay({
        workspace: task.workspace,
        recipients: task.assignedTo,
        type: "task_due_today",
        title: `Due Today: ${task.taskNumber}`,
        message: `${task.title} is due today.`,
        refModel: "Task",
        refId: task._id,
        actionUrl: `/tasks/${task._id}`,
        priority: 'high',
        channels: { inApp: true, email: true },
        metadata: { taskNumber: task.taskNumber, dueDate: task.dueDate }
      });
  }
});

// Overdue
cron.schedule("0 9 * * *", async () => {
  console.log('Running cron: Tasks Overdue');
  const today = dayjs().startOf("day").toDate();

  await markOverdueEvents();

  const tasks = await Task.find({
    dueDate: { $lt: today },
    status: { $nin: ["closed", "cancelled"] }
  });

  for (const task of tasks) {
      await notifyOncePerDay({
        workspace: task.workspace,
        recipients: task.assignedTo,
        type: "task_overdue",
        title: `Task Overdue: ${task.taskNumber}`,
        message: `${task.title} is overdue.`,
        refModel: "Task",
        refId: task._id,
        actionUrl: `/tasks/${task._id}`,
        priority: 'high',
        channels: { inApp: true, email: true, slack: true },
        metadata: { taskNumber: task.taskNumber, dueDate: task.dueDate }
      });
  }
});

// MOM pending signature
cron.schedule("0 10 * * *", async () => {
  console.log('Running cron: MOM Pending Signatures');
  const moms = await MOM.find({ status: "pending_signature" });
  for (const mom of moms) {
    const pendingUsers = mom.attendees.filter(a => a.signatureStatus === 'pending').map(a => a.user);
    if (pendingUsers.length > 0) {
        await notifyOncePerDay({
          workspace: mom.workspace,
          recipients: pendingUsers,
          type: "mom_pending_signature",
          title: `Signature Pending: ${mom.momNumber}`,
          message: `Please sign the MOM: ${mom.title}`,
          refModel: "MOM",
          refId: mom._id,
          actionUrl: `/mom/${mom._id}`,
          channels: { inApp: true, email: true },
          metadata: { momNumber: mom.momNumber, momTitle: mom.title }
        });
    }
  }
});

const reportScheduleService = require('./reportSchedule.service');

module.exports = {
  start: () => {
    console.log('✅ Cron Jobs started');
    reportScheduleService.start();
  }
};
