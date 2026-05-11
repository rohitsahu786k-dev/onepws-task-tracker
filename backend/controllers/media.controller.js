const asyncHandler = require('../utils/asyncHandler');
const MediaFile = require('../models/MediaFile');
const MediaFolder = require('../models/MediaFolder');
const MediaAccessLog = require('../models/MediaAccessLog');
const MediaFileVersion = require('../models/MediaFileVersion');
const mediaUploadService = require('../services/mediaUpload.service');
const { checkMediaAccess } = require('../services/mediaAccess.service');
const { createZip } = require('../services/mediaZip.service');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// @desc    Upload new media files
// @route   POST /api/workspaces/:wid/media/upload
const uploadMedia = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const { folder, tags, visibility, description } = req.body;

  if (!files.length) {
    return res.status(400).json({ success: false, message: "No files uploaded" });
  }

  const uploadedFiles = [];
  for (const file of files) {
    const media = await mediaUploadService.createMediaFile({
      workspace: req.params.wid,
      file,
      folder,
      tags,
      visibility,
      description,
      uploadedBy: req.user._id
    });
    uploadedFiles.push(media);
  }

  res.status(201).json({ success: true, message: "Files uploaded successfully", data: uploadedFiles });
});

// @desc    Get media files
// @route   GET /api/workspaces/:wid/media
const getMediaFiles = asyncHandler(async (req, res) => {
  const { search, fileCategory, folder, uploadedBy } = req.query;
  const query = { workspace: req.params.wid, isDeleted: false };

  if (search) {
    query.$text = { $search: search };
  }
  if (fileCategory) query.fileCategory = fileCategory;
  if (folder) query.folder = folder;
  if (uploadedBy) query.uploadedBy = uploadedBy;

  const files = await MediaFile.find(query)
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });

  // Filter based on access
  const accessibleFiles = files.filter(file => checkMediaAccess(file, req.user, req.workspaceRole, req.workspaceDepartment));

  res.json({ success: true, data: accessibleFiles });
});

// @desc    Download media file
// @route   GET /api/workspaces/:wid/media/:id/download
const downloadMedia = asyncHandler(async (req, res) => {
  const media = await MediaFile.findOne({ _id: req.params.id, workspace: req.params.wid, isDeleted: false });
  if (!media) return res.status(404).json({ success: false, message: "File not found" });

  const canAccess = checkMediaAccess(media, req.user, req.workspaceRole, req.workspaceDepartment);
  if (!canAccess) return res.status(403).json({ success: false, message: "You do not have access to this file" });

  media.downloadCount += 1;
  await media.save();

  await MediaAccessLog.create({
    workspace: req.params.wid,
    mediaFile: media._id,
    action: "downloaded",
    performedBy: req.user._id
  });

  res.download(media.filePath, media.displayName || media.originalName);
});

// @desc    Preview media file (Thumbnail or Actual file)
// @route   GET /api/workspaces/:wid/media/:id/preview
const previewMedia = asyncHandler(async (req, res) => {
  const media = await MediaFile.findOne({ _id: req.params.id, workspace: req.params.wid, isDeleted: false });
  if (!media) return res.status(404).json({ success: false, message: "File not found" });

  const canAccess = checkMediaAccess(media, req.user, req.workspaceRole, req.workspaceDepartment);
  if (!canAccess) return res.status(403).json({ success: false, message: "You do not have access to this file" });

  media.previewCount += 1;
  await media.save();

  const fileToSend = media.thumbnailPath || media.filePath;
  res.sendFile(fileToSend);
});

// @desc    Delete media file (Soft Delete)
// @route   DELETE /api/workspaces/:wid/media/:id
const deleteMedia = asyncHandler(async (req, res) => {
  const media = await MediaFile.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!media) return res.status(404).json({ success: false, message: "File not found" });

  // Access check
  if (req.workspaceRole !== 'admin' && req.user.globalRole !== 'super_admin' && media.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You don't have permission to delete this file" });
  }

  media.isDeleted = true;
  media.deletedAt = new Date();
  media.deletedBy = req.user._id;
  await media.save();

  await MediaAccessLog.create({
    workspace: req.params.wid,
    mediaFile: media._id,
    action: "deleted",
    performedBy: req.user._id
  });

  res.json({ success: true, message: "File deleted successfully" });
});

// @desc    Get folders
// @route   GET /api/workspaces/:wid/media/folders
const getFolders = asyncHandler(async (req, res) => {
  const folders = await MediaFolder.find({ workspace: req.params.wid, isDeleted: false });
  res.json({ success: true, data: folders });
});

// @desc    Create folder
// @route   POST /api/workspaces/:wid/media/folders
const createFolder = asyncHandler(async (req, res) => {
  const { name, parentFolder, color, icon, permissions } = req.body;
  const folder = await MediaFolder.create({
    workspace: req.params.wid,
    name,
    parentFolder: parentFolder || null,
    color,
    icon,
    permissions,
    createdBy: req.user._id
  });
  res.status(201).json({ success: true, data: folder });
});

// @desc    Bulk Download ZIP
// @route   POST /api/workspaces/:wid/media/bulk-download
const bulkDownload = asyncHandler(async (req, res) => {
  const { fileIds } = req.body;
  const files = await MediaFile.find({ _id: { $in: fileIds }, workspace: req.params.wid, isDeleted: false });
  
  const accessibleFiles = files.filter(f => checkMediaAccess(f, req.user, req.workspaceRole, req.workspaceDepartment));
  
  if (accessibleFiles.length === 0) {
    return res.status(400).json({ success: false, message: "No accessible files found" });
  }

  const zipDir = path.join(process.cwd(), 'uploads', 'workspaces', req.params.wid, 'media', 'archives');
  if (!fs.existsSync(zipDir)) fs.mkdirSync(zipDir, { recursive: true });

  const zipName = `ONEPWS_Bulk_Download_${Date.now()}.zip`;
  const zipPath = path.join(zipDir, zipName);

  await createZip(accessibleFiles, zipPath);

  // Send download directly or return URL
  res.download(zipPath, zipName);
});

module.exports = {
  uploadMedia,
  getMediaFiles,
  downloadMedia,
  previewMedia,
  deleteMedia,
  getFolders,
  createFolder,
  bulkDownload
};
