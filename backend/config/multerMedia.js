const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { getFileCategory, isAllowedFile } = require("../utils/fileCategory");

function createStorage() {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const workspaceId = req.params.wid;
      const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
      const category = getFileCategory(file.mimetype, ext);

      const uploadPath = path.join(
        process.cwd(),
        "uploads",
        "workspaces",
        workspaceId,
        "media",
        category
      );

      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      cb(null, `${unique}${ext}`);
    }
  });
}

const uploadMediaLib = multer({
  storage: createStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB general limit
  },
  fileFilter: function (req, file, cb) {
    if (!isAllowedFile(file)) {
      return cb(new Error("File type not allowed"), false);
    }
    cb(null, true);
  }
});

module.exports = {
  uploadMediaLib
};
