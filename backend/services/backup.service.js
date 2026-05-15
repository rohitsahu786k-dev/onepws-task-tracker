const fs = require('fs/promises');
const path = require('path');

const backupDir = path.join(__dirname, '..', 'uploads', 'backups');

const createBackupManifest = async (metadata = {}) => {
  await fs.mkdir(backupDir, { recursive: true });
  const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filePath = path.join(backupDir, fileName);
  await fs.writeFile(filePath, JSON.stringify({ createdAt: new Date(), ...metadata }, null, 2));
  return { fileName, filePath };
};

module.exports = { createBackupManifest };
