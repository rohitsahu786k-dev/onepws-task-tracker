const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

/**
 * Ensure upload directory exists
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/**
 * Build a Multer storage engine for a given sub-folder
 */
const buildStorage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(UPLOAD_PATH, subfolder);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });

/**
 * Allowed MIME types per category
 */
const mimeFilters = {
  image: /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/,
  document: /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|zip|x-zip-compressed)|text\/(plain|csv))$/,
  any: /^.+$/,
};

const buildFileFilter = (type = 'any') => (req, file, cb) => {
  if (mimeFilters[type].test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${type}`), false);
  }
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB

// ── Pre-built Multer instances ─────────────────────────────────────────────
const uploadAvatar = multer({
  storage: buildStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: buildFileFilter('image'),
});

const uploadMedia = multer({
  storage: buildStorage('media'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: buildFileFilter('any'),
});

const uploadAttachment = multer({
  storage: buildStorage('attachments'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: buildFileFilter('any'),
});

const uploadExpense = multer({
  storage: buildStorage('expenses'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: buildFileFilter('image'),
});

const uploadLogo = multer({
  storage: buildStorage('logos'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: buildFileFilter('image'),
});

module.exports = {
  uploadAvatar,
  uploadMedia,
  uploadAttachment,
  uploadExpense,
  uploadLogo,
  buildStorage,
  buildFileFilter,
};
