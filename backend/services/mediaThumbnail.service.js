const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function generateThumbnail({ filePath, workspaceId, storedName }) {
  const thumbDir = path.join(
    process.cwd(),
    "uploads",
    "workspaces",
    workspaceId,
    "thumbnails"
  );

  fs.mkdirSync(thumbDir, { recursive: true });

  const thumbName = `thumb-${storedName}.webp`;
  const thumbPath = path.join(thumbDir, thumbName);

  await sharp(filePath)
    .resize(300, 300, {
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  return thumbPath;
}

module.exports = {
  generateThumbnail
};
