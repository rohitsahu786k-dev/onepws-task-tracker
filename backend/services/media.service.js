const path = require('path');

const toPublicMediaUrl = (filePath) => {
  if (!filePath) return null;
  return `/uploads/${path.relative(path.join(__dirname, '..', 'uploads'), filePath).split(path.sep).join('/')}`;
};

const normalizeUploadedFile = (file) => file && ({
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  path: file.path,
  url: toPublicMediaUrl(file.path),
});

module.exports = { normalizeUploadedFile, toPublicMediaUrl };
