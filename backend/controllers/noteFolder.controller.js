const asyncHandler = require('../utils/asyncHandler');
const NoteFolder = require('../models/NoteFolder');
const Note = require('../models/Note');

const getWorkspaceId = (req) => req.params.wid || req.query.workspace || req.body.workspace || req.workspace?._id;

const list = asyncHandler(async (req, res) => {
  const query = { workspace: getWorkspaceId(req), isDeleted: { $ne: true } };
  if (req.query.parentFolder) query.parentFolder = req.query.parentFolder;
  if (req.query.visibility) query.visibility = req.query.visibility;
  const folders = await NoteFolder.find(query).sort({ order: 1, name: 1 });
  res.json({ success: true, data: folders, folders });
});

const create = asyncHandler(async (req, res) => {
  const folder = await NoteFolder.create({
    ...req.body,
    workspace: getWorkspaceId(req),
    owner: req.body.owner || req.user?._id,
    createdBy: req.user?._id,
  });
  res.status(201).json({ success: true, data: folder, folder });
});

const getById = asyncHandler(async (req, res) => {
  const folder = await NoteFolder.findOne({ _id: req.params.folderId || req.params.id, workspace: getWorkspaceId(req), isDeleted: { $ne: true } });
  if (!folder) return res.status(404).json({ success: false, message: 'Note folder not found' });
  res.json({ success: true, data: folder, folder });
});

const update = asyncHandler(async (req, res) => {
  const folder = await NoteFolder.findOneAndUpdate(
    { _id: req.params.folderId || req.params.id, workspace: getWorkspaceId(req), isDeleted: { $ne: true } },
    { ...req.body, updatedBy: req.user?._id },
    { new: true, runValidators: true }
  );
  if (!folder) return res.status(404).json({ success: false, message: 'Note folder not found' });
  res.json({ success: true, data: folder, folder });
});

const remove = asyncHandler(async (req, res) => {
  const folder = await NoteFolder.findOne({ _id: req.params.folderId || req.params.id, workspace: getWorkspaceId(req), isDeleted: { $ne: true } });
  if (!folder) return res.status(404).json({ success: false, message: 'Note folder not found' });
  await Note.updateMany({ workspace: getWorkspaceId(req), folder: folder._id }, { $unset: { folder: '' } });
  folder.isDeleted = true;
  folder.deletedAt = new Date();
  folder.deletedBy = req.user?._id;
  await folder.save();
  res.json({ success: true, message: 'Note folder deleted' });
});

const archive = asyncHandler(async (req, res) => {
  const folder = await NoteFolder.findOneAndUpdate({ _id: req.params.folderId || req.params.id, workspace: getWorkspaceId(req) }, { isArchived: true }, { new: true });
  if (!folder) return res.status(404).json({ success: false, message: 'Note folder not found' });
  res.json({ success: true, data: folder, folder });
});

const restore = asyncHandler(async (req, res) => {
  const folder = await NoteFolder.findOneAndUpdate({ _id: req.params.folderId || req.params.id, workspace: getWorkspaceId(req) }, { isArchived: false }, { new: true });
  if (!folder) return res.status(404).json({ success: false, message: 'Note folder not found' });
  res.json({ success: true, data: folder, folder });
});

const reorder = asyncHandler(async (req, res) => {
  const updates = req.body.folders || [];
  await Promise.all(updates.map((item) => NoteFolder.updateOne({ _id: item._id, workspace: getWorkspaceId(req) }, { order: item.order })));
  res.json({ success: true, message: 'Folders reordered' });
});

const notes = asyncHandler(async (req, res) => {
  const items = await Note.find({ workspace: getWorkspaceId(req), folder: req.params.folderId || req.params.id, isDeleted: { $ne: true } }).sort({ updatedAt: -1 });
  res.json({ success: true, data: items, notes: items });
});

module.exports = { list, getAll: list, create, getById, update, remove, delete: remove, archive, restore, reorder, notes };
