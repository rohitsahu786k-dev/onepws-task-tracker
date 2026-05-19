const asyncHandler = require('../utils/asyncHandler');
const Note = require('../models/Note');
const NoteVersion = require('../models/NoteVersion');
const NoteActivity = require('../models/NoteActivity');
const Task = require('../models/Task');
const WikiArticle = require('../models/WikiArticle');
const notificationService = require('../services/notification.service');
const noteActivityService = require('../services/noteActivity.service');
const noteService = require('../services/note.service');
const wikiService = require('../services/wiki.service');
const wikiActivityService = require('../services/wikiActivity.service');

const getWorkspaceId = (req) => req.params.wid || req.params.workspaceId || req.query.workspace || req.body.workspace || req.workspace?._id;
const getNoteId = (req) => req.params.noteId || req.params.id;

const buildQuery = (req) => {
  const query = noteService.noteAccessQuery(req);
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [{ title: search }, { plainText: search }, { tags: search }];
  }
  if (req.query.noteType) query.noteType = req.query.noteType;
  if (req.query.folder) query.folder = req.query.folder;
  if (req.query.project) query.project = req.query.project;
  if (req.query.task) query.task = req.query.task;
  if (req.query.meeting) query.meeting = req.query.meeting;
  if (req.query.mom) query.mom = req.query.mom;
  if (req.query.visibility) query.visibility = req.query.visibility;
  if (req.query.createdBy) query.createdBy = req.query.createdBy;
  if (req.query.pinned === 'true') query.isPinned = true;
  if (req.path?.includes('shared-with-me')) query['sharedWith.user'] = req.user?._id;
  if (req.query.archived === 'true') query.isArchived = true;
  else query.isArchived = { $ne: true };
  return query;
};

const list = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const query = buildQuery(req);
  const [items, total] = await Promise.all([
    Note.find(query)
      .populate('createdBy', 'name firstName lastName email')
      .populate('project', 'projectNumber title')
      .populate('task', 'taskNumber title')
      .sort({ isPinned: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Note.countDocuments(query),
  ]);

  res.json({ success: true, data: items, notes: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const create = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  if (!req.body.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
  const content = noteService.sanitizeContent(req.body.content || req.body.contentHtml || '');
  const sharedWith = (req.body.sharedWith || []).map((item) => ({ ...item, sharedAt: new Date(), sharedBy: req.user?._id }));
  const note = await Note.create({
    ...req.body,
    workspace,
    title: req.body.title,
    slug: noteService.slugifyTitle(req.body.title),
    content,
    contentHtml: content,
    plainText: req.body.plainText || content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    sharedWith,
    task: req.params.taskId || req.body.task,
    project: req.params.projectId || req.body.project,
    meeting: req.params.meetingId || req.body.meeting,
    mom: req.params.momId || req.body.mom,
    linkedTasks: req.params.taskId ? [req.params.taskId] : req.body.linkedTasks,
    linkedProjects: req.params.projectId ? [req.params.projectId] : req.body.linkedProjects,
    createdBy: req.user?._id,
    lastEditedAt: new Date(),
    lastEditedBy: req.user?._id,
  });

  await noteService.createVersion({ note, user: req.user?._id, changeSummary: 'Initial version' });
  await noteActivityService.log({ workspace, note: note._id, action: 'created', message: 'Note created', performedBy: req.user?._id });

  if (note.mentions?.length) {
    await notificationService.notify({
      workspace,
      sender: req.user?._id,
      recipients: note.mentions,
      type: 'note_mentioned',
      title: 'You were mentioned in a note',
      message: `${req.user?.name || 'A user'} mentioned you in ${note.title}.`,
      refModel: 'Note',
      refId: note._id,
      actionUrl: `/notes/${note._id}`,
      channels: { inApp: true, email: true },
    });
  }

  if (sharedWith.length) {
    await notificationService.notify({
      workspace,
      sender: req.user?._id,
      recipients: sharedWith.map((item) => item.user),
      type: 'note_shared',
      title: 'Note shared with you',
      message: `${req.user?.name || 'A user'} shared ${note.title} with you.`,
      refModel: 'Note',
      refId: note._id,
      actionUrl: `/notes/${note._id}`,
      channels: { inApp: true, email: false },
    });
  }

  res.status(201).json({ success: true, message: 'Note created successfully', data: note, note });
});

const getById = asyncHandler(async (req, res) => {
  const item = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) })
    .populate('createdBy', 'name firstName lastName email')
    .populate('sharedWith.user', 'name firstName lastName email')
    .populate('project', 'projectNumber title')
    .populate('task', 'taskNumber title');
  if (!item) return res.status(404).json({ success: false, message: 'Note not found' });
  res.json({ success: true, data: item, note: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(item, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });

  const oldValue = item.toObject();
  const patch = { ...req.body };
  if (patch.content !== undefined || patch.contentHtml !== undefined) {
    patch.content = noteService.sanitizeContent(patch.content || patch.contentHtml || '');
    patch.contentHtml = patch.content;
    patch.plainText = patch.plainText || patch.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (patch.title) patch.slug = noteService.slugifyTitle(patch.title);
  Object.assign(item, patch, { updatedBy: req.user?._id, lastEditedAt: new Date(), lastEditedBy: req.user?._id });
  await item.save();
  await noteService.createVersion({ note: item, user: req.user?._id, changeSummary: req.body.changeSummary || 'Manual save' });
  await noteActivityService.log({ workspace: item.workspace, note: item._id, action: 'updated', message: 'Note updated', oldValue, newValue: item, performedBy: req.user?._id });
  res.json({ success: true, data: item, note: item });
});

const autosave = asyncHandler(async (req, res) => {
  const item = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(item, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
  if (req.body.title) {
    item.title = req.body.title;
    item.slug = noteService.slugifyTitle(req.body.title);
  }
  if (req.body.content !== undefined || req.body.contentHtml !== undefined) {
    item.content = noteService.sanitizeContent(req.body.content || req.body.contentHtml || '');
    item.contentHtml = item.content;
  }
  if (req.body.contentJson !== undefined) item.contentJson = req.body.contentJson;
  if (req.body.plainText !== undefined) item.plainText = req.body.plainText;
  item.autoSaveAt = new Date();
  item.lastEditedAt = new Date();
  item.lastEditedBy = req.user?._id;
  item.updatedBy = req.user?._id;
  await item.save();
  await noteActivityService.log({ workspace: item.workspace, note: item._id, action: 'autosaved', message: 'Note autosaved', performedBy: req.user?._id });
  res.json({ success: true, message: 'Note autosaved', data: { autoSaveAt: item.autoSaveAt }, note: item });
});

const share = asyncHandler(async (req, res) => {
  const item = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(item, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
  item.visibility = req.body.visibility || item.visibility || 'shared';
  item.sharedWith = (req.body.sharedWith || item.sharedWith || []).map((entry) => ({ ...entry, sharedAt: entry.sharedAt || new Date(), sharedBy: entry.sharedBy || req.user?._id }));
  item.sharedDepartments = req.body.sharedDepartments || item.sharedDepartments;
  await item.save();
  await noteActivityService.log({ workspace: item.workspace, note: item._id, action: 'shared', message: 'Note sharing updated', performedBy: req.user?._id });
  res.json({ success: true, message: 'Note sharing updated', data: item, note: item });
});

const unshare = asyncHandler(async (req, res) => {
  const item = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(item, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
  item.sharedWith = [];
  item.sharedDepartments = [];
  item.visibility = 'private';
  await item.save();
  await noteActivityService.log({ workspace: item.workspace, note: item._id, action: 'unshared', message: 'Note unshared', performedBy: req.user?._id });
  res.json({ success: true, message: 'Note unshared', data: item, note: item });
});

const toggleFlag = (field, value, action) =>
  asyncHandler(async (req, res) => {
    const item = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
    if (!item) return res.status(404).json({ success: false, message: 'Note not found' });
    if (!noteService.canEdit(item, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
    item[field] = value;
    if (field === 'isPinned') item.pinnedAt = value ? new Date() : undefined;
    if (field === 'isArchived') {
      item.archivedAt = value ? new Date() : undefined;
      item.archivedBy = value ? req.user?._id : undefined;
    }
    await item.save();
    await noteActivityService.log({ workspace: item.workspace, note: item._id, action, message: `Note ${action}`, performedBy: req.user?._id });
    res.json({ success: true, data: item, note: item });
  });

const versions = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  const items = await NoteVersion.find({ workspace: getWorkspaceId(req), note: note._id }).sort({ versionNumber: -1 });
  res.json({ success: true, data: items, versions: items });
});

const createVersion = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(note, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
  const version = await noteService.createVersion({ note, user: req.user?._id, changeSummary: req.body.changeSummary });
  await noteActivityService.log({ workspace: note.workspace, note: note._id, action: 'version_created', message: 'Note version created', performedBy: req.user?._id });
  res.status(201).json({ success: true, data: version, version });
});

const restoreVersion = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(note, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
  const version = await NoteVersion.findOne({ _id: req.params.versionId, workspace: getWorkspaceId(req), note: note._id });
  if (!version) return res.status(404).json({ success: false, message: 'Note version not found' });
  await noteService.createVersion({ note, user: req.user?._id, changeSummary: 'Snapshot before restore' });
  note.title = version.title;
  note.content = version.content;
  note.contentHtml = version.content;
  note.contentJson = version.contentJson;
  note.plainText = version.plainText;
  note.lastEditedAt = new Date();
  note.lastEditedBy = req.user?._id;
  await note.save();
  await noteActivityService.log({ workspace: note.workspace, note: note._id, action: 'version_restored', message: `Restored version ${version.versionNumber}`, performedBy: req.user?._id });
  res.json({ success: true, message: 'Note version restored', data: note, note });
});

const addAttachment = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(note, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
  note.attachments.push({ ...req.body, uploadedBy: req.user?._id, uploadedAt: new Date() });
  await note.save();
  await noteActivityService.log({ workspace: note.workspace, note: note._id, action: 'attachment_added', message: 'Attachment added', performedBy: req.user?._id });
  res.status(201).json({ success: true, data: note.attachments[note.attachments.length - 1], note });
});

const removeAttachment = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(note, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
  note.attachments = note.attachments.filter((item) => item._id.toString() !== req.params.attachmentId);
  await note.save();
  await noteActivityService.log({ workspace: note.workspace, note: note._id, action: 'attachment_removed', message: 'Attachment removed', performedBy: req.user?._id });
  res.json({ success: true, message: 'Attachment removed', note });
});

const activity = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  const items = await NoteActivity.find({ workspace: getWorkspaceId(req), note: note._id }).populate('performedBy', 'name firstName lastName email').sort({ createdAt: -1 });
  res.json({ success: true, data: items, activity: items });
});

const convertToTask = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  const task = await Task.create({
    workspace: getWorkspaceId(req),
    taskNumber: req.body.taskNumber || `NOTE-${Date.now()}`,
    title: req.body.title || note.title,
    description: req.body.description || note.plainText || note.content,
    assignedTo: req.body.assignedTo,
    dueDate: req.body.dueDate,
    priority: req.body.priority || 'medium',
    project: req.body.project || note.project,
    sourceModule: 'manual',
    createdBy: req.user?._id,
  });
  note.linkedItems.push({ refModel: 'Task', refId: task._id });
  note.linkedTasks.push(task._id);
  await note.save();
  await noteActivityService.log({ workspace: note.workspace, note: note._id, action: 'linked_item_added', message: 'Note converted to task', performedBy: req.user?._id });
  res.status(201).json({ success: true, message: 'Note converted to task', data: task, task });
});

const convertToWiki = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(note, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });

  const workspace = getWorkspaceId(req);
  const content = wikiService.cleanHtml(note.contentHtml || note.content || '');
  const article = await WikiArticle.create({
    workspace,
    articleNumber: await wikiService.generateArticleNumber(workspace),
    title: req.body.title || note.title,
    slug: await wikiService.generateUniqueSlug({ workspace, title: req.body.title || note.title }),
    summary: req.body.summary || note.plainText?.slice(0, 240),
    articleType: req.body.articleType || 'guide',
    category: req.body.category,
    content,
    contentJson: note.contentJson,
    plainText: note.plainText || content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    tags: req.body.tags || note.tags,
    visibility: req.body.visibility || 'workspace',
    reviewers: req.body.reviewers || [],
    linkedItems: [{ refModel: 'Note', refId: note._id, label: note.title }],
    owner: req.user?._id,
    approval: {
      required: true,
      status: 'pending',
      approvers: (req.body.reviewers || []).map((user) => ({ user, status: 'pending' })),
    },
    status: 'draft',
    createdBy: req.user?._id,
    updatedBy: req.user?._id,
  });
  await wikiService.createVersion({ article, user: req.user?._id, changeSummary: 'Converted from note', changeType: 'created' });
  await wikiActivityService.log({ workspace, article: article._id, action: 'created', message: `Note converted to wiki article ${article.articleNumber}`, performedBy: req.user?._id });
  await noteActivityService.log({ workspace, note: note._id, action: 'linked_item_added', message: 'Note converted to wiki article', performedBy: req.user?._id });
  res.status(201).json({ success: true, message: 'Note converted to wiki article', data: article, article });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Note.findOne({ ...noteService.noteAccessQuery(req), _id: getNoteId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Note not found' });
  if (!noteService.canEdit(item, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
  item.isDeleted = true;
  item.deletedAt = new Date();
  item.deletedBy = req.user?._id;
  await item.save();
  await noteActivityService.log({ workspace: item.workspace, note: item._id, action: 'deleted', message: 'Note deleted', performedBy: req.user?._id });
  res.json({ success: true, message: 'Note deleted' });
});

module.exports = {
  getAll: list,
  list,
  create,
  getById,
  getOne: getById,
  update,
  autosave,
  share,
  unshare,
  pin: toggleFlag('isPinned', true, 'pinned'),
  unpin: toggleFlag('isPinned', false, 'unpinned'),
  favorite: toggleFlag('isFavorite', true, 'updated'),
  unfavorite: toggleFlag('isFavorite', false, 'updated'),
  archive: toggleFlag('isArchived', true, 'archived'),
  restore: toggleFlag('isArchived', false, 'restored'),
  versions,
  createVersion,
  restoreVersion,
  addAttachment,
  removeAttachment,
  activity,
  convertToTask,
  convertToWiki,
  remove,
  delete: remove,
};
