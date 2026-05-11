function getFileCategory(mimeType, extension) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";

  if (["xls", "xlsx", "csv"].includes(extension)) return "spreadsheet";
  if (["ppt", "pptx"].includes(extension)) return "presentation";
  if (["doc", "docx", "rtf"].includes(extension)) return "document";
  if (["zip", "rar", "7z"].includes(extension)) return "archive";

  return "other";
}

function isAllowedFile(file) {
  const allowedExts = [
    "jpg", "jpeg", "png", "webp", "gif", "svg",
    "pdf", "doc", "docx", "rtf", "txt",
    "xls", "xlsx", "csv",
    "ppt", "pptx",
    "mp4", "mov", "webm",
    "mp3", "wav",
    "zip"
  ];
  
  const ext = file.originalname.split('.').pop().toLowerCase();
  
  // Basic block list
  const blockedExts = ["exe", "bat", "cmd", "sh", "php", "js", "html", "msi", "dll", "apk", "jar", "scr", "vbs", "ps1"];
  
  if (blockedExts.includes(ext)) return false;
  
  return allowedExts.includes(ext);
}

module.exports = {
  getFileCategory,
  isAllowedFile
};
