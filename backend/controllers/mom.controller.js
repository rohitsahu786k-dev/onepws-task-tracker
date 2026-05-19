const path = require('path');
const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const MOM = require('../models/MOM');
const MOMTemplate = require('../models/MOMTemplate');
const MOMActivity = require('../models/MOMActivity');
const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { syncMOMEvent } = require('../services/calendar.service');
const momService = require('../services/mom.service');
const momSignatureService = require('../services/momSignature.service');
const momNotificationService = require('../services/momNotification.service');
const momEmailService = require('../services/momEmail.service');
const momActivityService = require('../services/momActivity.service');
const momCalendarService = require('../services/momCalendar.service');
const momPdfService = require('../services/momPdf.service');
const momReportService = require('../services/momReport.service');
const taskService = require('../services/task.service');

const workspaceId = (req) => req.workspace?._id || req.params.wid || req.body.workspace || req.query.workspace;
const momId = (req) => req.params.momId || req.params.id;

function applyMOMVisibility(query, req) {
  if (req.user?.globalRole === 'super_admin' || ['owner', 'admin', 'super_admin'].includes(req.workspaceRole)) return query;
  if (req.workspaceRole === 'manager') {
    query.$or = [
      { createdBy: req.user._id },
      { 'attendees.user': req.user._id },
      { 'attendees.department': req.workspaceDepartment },
      { 'actionPoints.responsiblePerson': req.user._id },
    ];
  } else if (req.workspaceRole === 'member') {
    query.$or = [
      { createdBy: req.user._id },
      { 'attendees.user': req.user._id },
      { 'actionPoints.responsiblePerson': req.user._id },
    ];
  } else if (req.workspaceRole === 'viewer') {
    query.visibility = { $ne: 'private' };
  }
  return query;
}

function buildMOMQuery(req, extra = {}) {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true }, ...extra };
  if (req.query.status) query.status = req.query.status;
  if (req.query.momType) query.momType = req.query.momType;
  if (req.query.project) query.project = req.query.project;
  if (req.query.task) query.task = req.query.task;
  if (req.query.meeting) query.meeting = req.query.meeting;
  if (req.query.createdBy) query.createdBy = req.query.createdBy;
  if (req.query.attendee) query['attendees.user'] = req.query.attendee;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    query.$or = [{ momNumber: regex }, { title: regex }, { agenda: regex }];
  }
  if (req.query.start || req.query.end) {
    query.meetingDate = {};
    if (req.query.start) query.meetingDate.$gte = dayjs(req.query.start).startOf('day').toDate();
    if (req.query.end) query.meetingDate.$lte = dayjs(req.query.end).endOf('day').toDate();
  }
  return applyMOMVisibility(query, req);
}

async function getMOMOr404(req, res) {
  const mom = await MOM.findOne({ _id: momId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!mom) {
    res.status(404).json({ success: false, message: 'MOM not found' });
    return null;
  }
  return mom;
}

const getAll = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 200);
  const skip = (page - 1) * limit;
  const query = buildMOMQuery(req);
  const [moms, total] = await Promise.all([
    MOM.find(query).populate('project', 'name title projectNumber').populate('task', 'taskNumber title').sort({ meetingDate: -1 }).skip(skip).limit(limit),
    MOM.countDocuments(query),
  ]);
  res.json({ success: true, moms, data: moms, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const create = asyncHandler(async (req, res) => {
  const mom = await momService.createMOM({ ...req.body, workspace: workspaceId(req) }, req.user);
  if (mom.meeting) await Meeting.findByIdAndUpdate(mom.meeting, { mom: mom._id });
  if (mom.project) await Project.findByIdAndUpdate(mom.project, { $addToSet: { linkedMOMs: mom._id } }).catch(() => null);
  if (mom.task) await Task.findByIdAndUpdate(mom.task, { $addToSet: { linkedMOMs: mom._id } }).catch(() => null);
  await momCalendarService.syncAllPointEvents(mom);
  await syncMOMEvent(mom);
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'created', message: `MOM ${mom.momNumber} created`, performedBy: req.user._id });
  res.status(201).json({ success: true, message: 'MOM created successfully', mom, data: mom });
});

const createFromMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.meetingId, workspace: workspaceId(req) });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  if (meeting.mom) return res.status(409).json({ success: false, message: 'MOM already exists for this meeting' });
  const prefill = await momService.prefillFromMeeting(workspaceId(req), meeting._id);
  const mom = await momService.createMOM({ ...prefill, ...req.body, workspace: workspaceId(req) }, req.user);
  meeting.mom = mom._id;
  await meeting.save();
  await syncMOMEvent(mom);
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'created', message: 'MOM created from meeting', performedBy: req.user._id });
  res.status(201).json({ success: true, message: 'MOM created from meeting successfully', mom, data: mom });
});

const getById = asyncHandler(async (req, res) => {
  const mom = await MOM.findOne({ _id: momId(req), workspace: workspaceId(req), isDeleted: { $ne: true } })
    .populate('project task meeting')
    .populate('attendees.user actionPoints.responsiblePerson createdBy', 'name firstName lastName email avatar');
  if (!mom) return res.status(404).json({ success: false, message: 'MOM not found' });
  const activities = await momActivityService.listForMOM(workspaceId(req), mom._id);
  res.json({ success: true, mom: { ...mom.toObject(), activities }, data: { ...mom.toObject(), activities } });
});

const update = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  if (mom.isLocked && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(423).json({ success: false, message: 'Signed MOM is locked' });
  }
  Object.assign(mom, req.body, { updatedBy: req.user._id });
  await mom.save();
  await momCalendarService.syncAllPointEvents(mom);
  await syncMOMEvent(mom);
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'updated', performedBy: req.user._id });
  res.json({ success: true, mom, data: mom });
});

const remove = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  mom.isDeleted = true;
  mom.deletedAt = new Date();
  mom.deletedBy = req.user._id;
  await mom.save();
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'deleted', performedBy: req.user._id });
  res.json({ success: true, message: 'MOM deleted' });
});

const sendForSignature = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  if (!mom.attendees?.length) return res.status(400).json({ success: false, message: 'At least one attendee is required' });
  mom.status = 'sent_for_signature';
  mom.sentAt = new Date();
  mom.sentBy = req.user._id;
  mom.signatureSummary = momSignatureService.calculateSignatureSummary(mom);
  await mom.save();
  await momNotificationService.notifySignatureRequired({ workspace: workspaceId(req), sender: req.user._id, mom });
  await momEmailService.sendSignatureRequestEmail(mom);
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'sent_for_signature', message: 'MOM sent for signature', performedBy: req.user._id });
  res.json({ success: true, message: 'MOM sent for signature successfully', mom, data: mom });
});

const sign = asyncHandler(async (req, res) => {
  if (req.body.confirmation === false) return res.status(400).json({ success: false, message: 'Signature confirmation is required' });
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  const attendee = mom.attendees.find((item) => item.user?.toString() === req.user._id.toString());
  if (!attendee) return res.status(403).json({ success: false, message: 'Only MOM attendees can sign this MOM' });
  if (attendee.signatureRequired === false) return res.status(400).json({ success: false, message: 'Your signature is not required' });
  if (attendee.signed) return res.status(409).json({ success: false, message: 'You have already signed this MOM' });
  attendee.signed = true;
  attendee.signedAt = new Date();
  attendee.signatureText = req.body.signatureText || req.user.name || req.user.email;
  attendee.signatureIpAddress = req.ip;
  attendee.signatureUserAgent = req.headers['user-agent'];
  momSignatureService.applySignatureStatus(mom, req.user._id);
  await mom.save();
  await momNotificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: [mom.createdBy].filter(Boolean),
    type: 'mom_signed',
    title: `MOM Signed: ${mom.momNumber}`,
    message: `${req.user.name || req.user.email} has signed ${mom.title}.`,
    refModel: 'MOM',
    refId: mom._id,
    actionUrl: `/mom/${mom._id}`,
    channels: { inApp: true, email: false },
  });
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'signed', message: `${req.user.name || req.user.email} signed the MOM`, performedBy: req.user._id });
  res.json({ success: true, message: 'MOM signed successfully', mom, data: mom });
});

const remindSignatures = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  await momNotificationService.notifySignatureRequired({ workspace: workspaceId(req), sender: req.user._id, mom });
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'signature_reminder_sent', performedBy: req.user._id });
  res.json({ success: true, message: 'Signature reminders sent' });
});

const complete = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  if (mom.status !== 'signed') return res.status(400).json({ success: false, message: 'MOM must be fully signed before completion' });
  const openPoints = mom.actionPoints.filter((point) => ['open', 'in_progress', 'overdue'].includes(point.status));
  if (openPoints.length) return res.status(400).json({ success: false, message: 'All action points must be completed or cancelled before completing MOM' });
  mom.status = 'completed';
  mom.completedAt = new Date();
  await mom.save();
  await momNotificationService.notify({
    workspace: workspaceId(req),
    recipients: mom.attendees.map((item) => item.user).filter(Boolean),
    type: 'mom_completed',
    title: `MOM Completed: ${mom.momNumber}`,
    message: `${mom.title} has been completed.`,
    refModel: 'MOM',
    refId: mom._id,
    actionUrl: `/mom/${mom._id}`,
    channels: { inApp: true },
  });
  res.json({ success: true, message: 'MOM completed successfully', mom, data: mom });
});

const cancel = asyncHandler(async (req, res) => {
  if (!req.body.reason) return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  if (['signed', 'completed'].includes(mom.status) && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(403).json({ success: false, message: 'Only admin can cancel signed MOMs' });
  }
  mom.status = 'cancelled';
  mom.cancelledAt = new Date();
  mom.cancellationReason = req.body.reason;
  mom.isLocked = true;
  await mom.save();
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'cancelled', message: req.body.reason, performedBy: req.user._id });
  res.json({ success: true, mom, data: mom });
});

const archive = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  mom.status = 'archived';
  await mom.save();
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'archived', performedBy: req.user._id });
  res.json({ success: true, mom, data: mom });
});

const restore = asyncHandler(async (req, res) => {
  const mom = await MOM.findOne({ _id: momId(req), workspace: workspaceId(req), isDeleted: true });
  if (!mom) return res.status(404).json({ success: false, message: 'MOM not found' });
  mom.isDeleted = false;
  mom.deletedAt = undefined;
  mom.deletedBy = undefined;
  mom.status = mom.status === 'archived' ? 'draft' : mom.status;
  await mom.save();
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'restored', performedBy: req.user._id });
  res.json({ success: true, mom, data: mom });
});

const generatePdf = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  const fileName = `${mom.momNumber}-${Date.now()}.pdf`;
  const filePath = path.join(process.cwd(), 'uploads', 'workspaces', String(workspaceId(req)), 'moms', 'pdf', fileName);
  await momPdfService.generateMOMPDF({ mom, workspace: req.workspace, generatedBy: req.user._id, filePath });
  const fileUrl = `/uploads/workspaces/${workspaceId(req)}/moms/pdf/${fileName}`;
  mom.pdfFile = { filePath, fileUrl, generatedAt: new Date(), generatedBy: req.user._id };
  mom.pdfFilePath = filePath;
  mom.pdfFileUrl = fileUrl;
  await mom.save();
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'pdf_generated', message: fileName, performedBy: req.user._id });
  res.json({ success: true, message: 'MOM PDF generated successfully', data: mom.pdfFile });
});

const downloadPdf = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  if (!mom.pdfFilePath) return res.status(404).json({ success: false, message: 'PDF not generated' });
  res.download(mom.pdfFilePath);
});

const emailMOM = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  await momNotificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: req.body.recipients || mom.attendees.map((item) => item.user).filter(Boolean),
    type: 'mom_pdf_generated',
    title: `MOM Shared: ${mom.momNumber}`,
    message: `${mom.title} has been shared with you.`,
    refModel: 'MOM',
    refId: mom._id,
    actionUrl: `/mom/${mom._id}`,
    channels: { inApp: true, email: true },
  });
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'email_sent', performedBy: req.user._id });
  res.json({ success: true, message: 'MOM emailed successfully' });
});

const addAttachment = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  mom.attachments.push({ ...req.body, uploadedBy: req.user._id, uploadedAt: new Date() });
  await mom.save();
  res.status(201).json({ success: true, attachments: mom.attachments, data: mom.attachments });
});

const deleteAttachment = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  const attachment = mom.attachments.id(req.params.attachmentId);
  if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });
  attachment.deleteOne();
  await mom.save();
  res.json({ success: true, attachments: mom.attachments, data: mom.attachments });
});

const addActionPoint = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  mom.actionPoints.push({ ...req.body, pointNumber: req.body.pointNumber || mom.actionPoints.length + 1 });
  await mom.save();
  const point = mom.actionPoints[mom.actionPoints.length - 1];
  await momCalendarService.syncPointCalendarEvent(mom, point);
  await mom.save();
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'point_added', message: point.title, performedBy: req.user._id });
  res.status(201).json({ success: true, mom, data: point });
});

const updateActionPoint = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  const point = mom.actionPoints.id(req.params.pointId);
  if (!point) return res.status(404).json({ success: false, message: 'Action point not found' });
  Object.assign(point, req.body);
  await momCalendarService.syncPointCalendarEvent(mom, point);
  await mom.save();
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'point_updated', message: point.title, performedBy: req.user._id });
  res.json({ success: true, mom, data: point });
});

const deleteActionPoint = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  const point = mom.actionPoints.id(req.params.pointId);
  if (!point) return res.status(404).json({ success: false, message: 'Action point not found' });
  point.deleteOne();
  await mom.save();
  res.json({ success: true, mom, data: mom.actionPoints });
});

const completeActionPoint = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  const point = mom.actionPoints.id(req.params.pointId);
  if (!point) return res.status(404).json({ success: false, message: 'Action point not found' });
  point.status = 'completed';
  point.completedAt = new Date();
  point.completedBy = req.user._id;
  point.remarks = req.body.remarks;
  await momCalendarService.syncPointCalendarEvent(mom, point);
  await mom.save();
  await momActivityService.log({ workspace: workspaceId(req), mom: mom._id, action: 'point_completed', message: `Action point ${point.pointNumber} completed`, performedBy: req.user._id });
  res.json({ success: true, message: 'MOM action point completed successfully', mom, data: mom });
});

const cancelActionPoint = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  const point = mom.actionPoints.id(req.params.pointId);
  if (!point) return res.status(404).json({ success: false, message: 'Action point not found' });
  point.status = 'cancelled';
  point.remarks = req.body.reason || req.body.remarks;
  await momCalendarService.syncPointCalendarEvent(mom, point);
  await mom.save();
  res.json({ success: true, mom, data: point });
});

const createTaskFromPoint = asyncHandler(async (req, res) => {
  const mom = await getMOMOr404(req, res);
  if (!mom) return;
  const point = mom.actionPoints.id(req.params.pointId);
  if (!point) return res.status(404).json({ success: false, message: 'MOM point not found' });
  const task = await taskService.createTaskFromSource({
    workspace: workspaceId(req),
    sourceModule: 'mom',
    sourceRef: { refModel: 'MOM', refId: mom._id },
    title: point.title,
    description: point.description,
    project: mom.project,
    requestedByDepartment: point.responsibleDepartment,
    assignedTo: point.responsiblePerson ? [point.responsiblePerson] : [],
    dueDate: point.targetDate,
    priority: point.priority,
    createdBy: req.user._id,
  }, req.user);
  point.linkedTask = task._id;
  point.status = 'in_progress';
  await momCalendarService.syncPointCalendarEvent(mom, point);
  await mom.save();
  res.json({ success: true, message: 'Task created from MOM point successfully', task, data: task });
});

const myPendingSignatures = asyncHandler(async (req, res) => {
  const moms = await MOM.find({ workspace: workspaceId(req), status: { $in: ['sent_for_signature', 'partially_signed'] }, attendees: { $elemMatch: { user: req.user._id, signed: { $ne: true }, signatureRequired: { $ne: false } } }, isDeleted: { $ne: true } });
  res.json({ success: true, moms, data: moms });
});

const pendingActionPoints = asyncHandler(async (req, res) => {
  const moms = await MOM.find({ workspace: workspaceId(req), 'actionPoints.status': { $in: ['open', 'in_progress'] }, isDeleted: { $ne: true } });
  res.json({ success: true, moms, data: moms });
});

const overdueActionPoints = asyncHandler(async (req, res) => {
  const moms = await MOM.find({ workspace: workspaceId(req), 'actionPoints.status': 'overdue', isDeleted: { $ne: true } });
  res.json({ success: true, moms, data: moms });
});

const activity = asyncHandler(async (req, res) => {
  const activities = await momActivityService.listForMOM(workspaceId(req), momId(req));
  res.json({ success: true, activities, data: activities });
});

const reports = asyncHandler(async (req, res) => {
  const metrics = await momReportService.getMetrics(workspaceId(req));
  res.json({ success: true, data: metrics });
});

const exportReports = asyncHandler(async (req, res) => {
  const moms = await MOM.find(buildMOMQuery(req)).lean();
  res.json({ success: true, format: req.params.format, data: moms });
});

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await MOMTemplate.find({ workspace: workspaceId(req), isActive: { $ne: false } }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, templates, data: templates });
});

const createTemplate = asyncHandler(async (req, res) => {
  if (req.body.isDefault) await MOMTemplate.updateMany({ workspace: workspaceId(req), momType: req.body.momType || 'general' }, { isDefault: false });
  const template = await MOMTemplate.create({ ...req.body, workspace: workspaceId(req), createdBy: req.user._id });
  res.status(201).json({ success: true, template, data: template });
});

const getTemplate = asyncHandler(async (req, res) => {
  const template = await MOMTemplate.findOne({ _id: req.params.templateId, workspace: workspaceId(req) });
  if (!template) return res.status(404).json({ success: false, message: 'MOM template not found' });
  res.json({ success: true, template, data: template });
});

const updateTemplate = asyncHandler(async (req, res) => {
  if (req.body.isDefault) await MOMTemplate.updateMany({ workspace: workspaceId(req), _id: { $ne: req.params.templateId }, momType: req.body.momType || 'general' }, { isDefault: false });
  const template = await MOMTemplate.findOneAndUpdate({ _id: req.params.templateId, workspace: workspaceId(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
  if (!template) return res.status(404).json({ success: false, message: 'MOM template not found' });
  res.json({ success: true, template, data: template });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await MOMTemplate.findOneAndUpdate({ _id: req.params.templateId, workspace: workspaceId(req) }, { isActive: false, updatedBy: req.user._id }, { new: true });
  if (!template) return res.status(404).json({ success: false, message: 'MOM template not found' });
  res.json({ success: true, message: 'MOM template deleted', template, data: template });
});

const setDefaultTemplate = asyncHandler(async (req, res) => {
  const template = await MOMTemplate.findOne({ _id: req.params.templateId, workspace: workspaceId(req) });
  if (!template) return res.status(404).json({ success: false, message: 'MOM template not found' });
  await MOMTemplate.updateMany({ workspace: workspaceId(req), momType: template.momType }, { isDefault: false });
  template.isDefault = true;
  await template.save();
  res.json({ success: true, template, data: template });
});

const cloneTemplate = asyncHandler(async (req, res) => {
  const source = await MOMTemplate.findOne({ _id: req.params.templateId, workspace: workspaceId(req) }).lean();
  if (!source) return res.status(404).json({ success: false, message: 'MOM template not found' });
  delete source._id;
  delete source.createdAt;
  delete source.updatedAt;
  const template = await MOMTemplate.create({ ...source, name: req.body.name || `${source.name} Copy`, isDefault: false, createdBy: req.user._id });
  res.status(201).json({ success: true, template, data: template });
});

module.exports = {
  getAll,
  create,
  createFromMeeting,
  getById,
  update,
  remove,
  sendForSignature,
  sign,
  remindSignatures,
  complete,
  cancel,
  archive,
  restore,
  generatePdf,
  downloadPdf,
  emailMOM,
  addAttachment,
  deleteAttachment,
  addActionPoint,
  updateActionPoint,
  deleteActionPoint,
  completeActionPoint,
  cancelActionPoint,
  createTaskFromPoint,
  myPendingSignatures,
  pendingActionPoints,
  overdueActionPoints,
  activity,
  reports,
  exportReports,
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  cloneTemplate,
};
