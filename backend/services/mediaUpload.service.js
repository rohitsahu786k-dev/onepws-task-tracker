const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sharp = require("sharp");
const MediaFile = require("../models/MediaFile");
const MediaAccessLog = require("../models/MediaAccessLog");
const { getFileCategory } = require("../utils/fileCategory");
const { generateThumbnail } = require("./mediaThumbnail.service");

function calculateChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

async function createMediaFile({
  workspace,
  file,
  folder,
  tags,
  visibility,
  description,
  uploadedBy
}) {
  const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
  const category = getFileCategory(file.mimetype, ext);
  const checksum = calculateChecksum(file.path);

  let thumbnailPath = null;
  let dimensions = null;

  if (category === "image") {
    try {
      const metadata = await sharp(file.path).metadata();
      dimensions = { width: metadata.width, height: metadata.height };

      thumbnailPath = await generateThumbnail({
        filePath: file.path,
        workspaceId: workspace.toString(),
        storedName: path.basename(file.filename, path.extname(file.filename))
      });
    } catch(err) {
      console.error('Thumbnail generation failed', err);
    }
  }

  const media = await MediaFile.create({
    workspace,
    folder: folder || null,
    originalName: file.originalname,
    storedName: file.filename,
    displayName: file.originalname,
    filePath: file.path,
    thumbnailPath,
    mimeType: file.mimetype,
    extension: ext,
    fileCategory: category,
    size: file.size,
    dimensions,
    checksum,
    tags: tags ? JSON.parse(tags) : [],
    description,
    permissions: {
      visibility: visibility || "workspace"
    },
    uploadedBy
  });

  await MediaAccessLog.create({
    workspace,
    mediaFile: media._id,
    action: "uploaded",
    performedBy: uploadedBy
  });

  return media;
}

module.exports = {
  createMediaFile,
  calculateChecksum
};
