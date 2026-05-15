/**
 * media.controller.enhanced.js - Complete Media Management
 * Handles: Upload, Download, Preview, Delete, Organize
 */

const asyncHandler = require('../utils/asyncHandler');
const MediaFile = require('../models/MediaFile');
const MediaFolder = require('../models/MediaFolder');
const MediaAccessLog = require('../models/MediaAccessLog');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const mediaUploadService = require('../services/mediaUpload.service');
const fs = require('fs');
const path = require('path');

/**
 * UPLOAD MEDIA FILES
 * POST /api/workspaces/:wid/media/upload
 */
const uploadMediaFiles = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const files = req.files || [];
  const { folderId, tags, visibility = 'private', description } = req.body;

  if (!files.length) {
    throw new ApiError(400, 'No files uploaded');
  }

  const uploadedFiles = [];
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf',
    'video/mp4', 'video/mpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];

  for (const file of files) {
    // Validate file type
    if (!allowedMimes.includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      continue;
    }

    // Create media record
    const media = await MediaFile.create({
      workspace: wid,
      folder: folderId || null,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      extension: path.extname(file.originalname).toLowerCase().replace('.', ''),
      tags: tags ? tags.split(',') : [],
      visibility,
      description,
      uploadedBy: req.user._id
    });

    // Generate thumbnail for images
    if (file.mimetype.startsWith('image/')) {
      try {
        const sharp = require('sharp');
        const thumbName = `thumb_${file.filename}`;
        const thumbPath = path.join('uploads', 'thumbnails', thumbName);

        await sharp(file.path)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbPath);

        media.thumbnailPath = thumbPath;
        await media.save();
      } catch (err) {
        console.warn('Thumbnail generation failed:', err);
      }
    }

    uploadedFiles.push(media);

    // Activity log
    await ActivityLog.create({
      workspace: wid,
      user: req.user._id,
      action: 'media_uploaded',
      refId: media._id,
      refModel: 'MediaFile',
      meta: { fileName: file.originalname, size: file.size }
    });
  }

  return res.status(201).json(
    new ApiResponse(201, uploadedFiles, `${uploadedFiles.length} file(s) uploaded`)
  );
});

/**
 * GET MEDIA FILES (list with filters)
 * GET /api/workspaces/:wid/media?folderId=&type=&search=&page=1&limit=30
 */
const getMediaFiles = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { folderId, type, search, page = 1, limit = 30 } = req.query;

  const filter = { workspace: wid };

  // Folder filter
  if (folderId === 'root') {
    filter.folder = null;
  } else if (folderId) {
    filter.folder = folderId;
  }

  // Type filter
  if (type === 'image') filter.mimeType = { $regex: '^image/' };
  if (type === 'document') filter.extension = { $in: ['pdf', 'docx', 'xlsx', 'txt', 'pptx'] };
  if (type === 'video') filter.mimeType = { $regex: '^video/' };

  // Search filter
  if (search) {
    filter.originalName = { $regex: search, $options: 'i' };
  }

  // Access control
  if (req.workspaceRole === 'member') {
    filter.$or = [
      { visibility: { $ne: 'private' } },
      { uploadedBy: req.user._id }
    ];
  }

  const total = await MediaFile.countDocuments(filter);

  const files = await MediaFile.find(filter)
    .populate('uploadedBy', 'name email avatar')
    .populate('folder', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  return res.json(
    new ApiResponse(200, {
      files,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    })
  );
});

/**
 * GET MEDIA FOLDERS
 * GET /api/workspaces/:wid/media/folders
 */
const getMediaFolders = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { parentId } = req.query;

  const filter = { workspace: wid };
  if (parentId) {
    filter.parent = parentId;
  } else {
    filter.parent = null;
  }

  const folders = await MediaFolder.find(filter)
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  return res.json(new ApiResponse(200, folders));
});

/**
 * SERVE MEDIA FILE (download / preview)
 * GET /api/workspaces/:wid/media/:fileId/serve
 */
const serveMediaFile = asyncHandler(async (req, res) => {
  const { wid, fileId } = req.params;

  const file = await MediaFile.findOne({
    _id: fileId,
    workspace: wid
  });

  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  // Check access
  if (file.visibility === 'private' && file.uploadedBy.toString() !== req.user._id.toString() && req.workspaceRole !== 'admin') {
    throw new ApiError(403, 'Access denied');
  }

  // Log access
  await MediaAccessLog.create({
    workspace: wid,
    mediaFile: fileId,
    action: 'downloaded',
    performedBy: req.user._id
  });

  file.downloadCount = (file.downloadCount || 0) + 1;
  await file.save();

  const filePath = path.join(__dirname, '../../uploads/media', file.storedName);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'File not found on disk');
  }

  // Support range requests for video streaming
  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range && file.mimeType.startsWith('video/')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.originalName}"`
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);

    fs.createReadStream(filePath).pipe(res);
  }
});

/**
 * GET THUMBNAIL
 * GET /api/workspaces/:wid/media/:fileId/thumbnail
 */
const getThumbnail = asyncHandler(async (req, res) => {
  const { wid, fileId } = req.params;

  const file = await MediaFile.findOne({
    _id: fileId,
    workspace: wid
  });

  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  let thumbPath = file.thumbnailPath;

  if (!thumbPath || !fs.existsSync(thumbPath)) {
    // Placeholder
    return res.sendFile(
      path.join(__dirname, '../../public', 'file-placeholder.png')
    );
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.resolve(thumbPath));
});

/**
 * DELETE MEDIA FILE
 * DELETE /api/workspaces/:wid/media/:fileId
 */
const deleteMediaFile = asyncHandler(async (req, res) => {
  const { wid, fileId } = req.params;

  const file = await MediaFile.findOne({
    _id: fileId,
    workspace: wid
  });

  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  // Delete from disk
  const filePath = path.join(__dirname, '../../uploads/media', file.storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete thumbnail
  if (file.thumbnailPath && fs.existsSync(file.thumbnailPath)) {
    fs.unlinkSync(file.thumbnailPath);
  }

  await MediaFile.findByIdAndDelete(fileId);

  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'media_deleted',
    meta: { fileName: file.originalName }
  });

  return res.json(new ApiResponse(200, null, 'File deleted'));
});

module.exports = {
  uploadMediaFiles,
  getMediaFiles,
  getMediaFolders,
  serveMediaFile,
  getThumbnail,
  deleteMediaFile
};
