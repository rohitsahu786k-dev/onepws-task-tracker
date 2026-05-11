const archiver = require("archiver");
const fs = require("fs");

async function createZip(files, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });

    output.on("close", () => {
      resolve(outputPath);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    files.forEach(file => {
      if (fs.existsSync(file.filePath)) {
        archive.file(file.filePath, {
          name: file.displayName || file.originalName
        });
      }
    });

    archive.finalize();
  });
}

module.exports = {
  createZip
};
