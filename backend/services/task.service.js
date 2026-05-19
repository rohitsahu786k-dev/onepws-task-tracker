const Task = require('../models/Task');
const taskNumberService = require('./taskNumber.service');
const taskStageService = require('./taskStage.service');

async function createTask(payload, user) {
  const taskNumber = payload.taskNumber || await taskNumberService.generateTaskNumber(payload.workspace);
  const defaultStage = await taskStageService.getDefaultStage(payload.workspace, user?._id);
  return Task.create({
    ...payload,
    taskNumber,
    requestedBy: payload.requestedBy || user?._id,
    assignedBy: payload.assignedBy || user?._id,
    stage: payload.stage || defaultStage?._id,
    status: payload.status || defaultStage?.mappedStatus || 'open',
    createdBy: payload.createdBy || user?._id,
  });
}

async function createTaskFromSource(payload, user) {
  return createTask(payload, user || { _id: payload.createdBy });
}

module.exports = { createTask, createTaskFromSource };
