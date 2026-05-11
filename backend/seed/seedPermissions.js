require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const PermissionConfig = require('../models/PermissionConfig');
const { DEFAULT_ALLOWED_MODULES, DEFAULT_ROLE_PERMISSIONS } = require('../constants/defaultPermissions');

async function seedPermissions(workspaceId) {
  const query = workspaceId ? { _id: workspaceId } : {};
  const workspaces = await Workspace.find(query);

  for (const workspace of workspaces) {
    workspace.allowedModules = { ...DEFAULT_ALLOWED_MODULES, ...(workspace.allowedModules?.toObject?.() || workspace.allowedModules || {}) };
    await workspace.save();

    for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      await PermissionConfig.findOneAndUpdate(
        { workspace: workspace._id, role },
        { permissions, isSystemDefault: true },
        { upsert: true, new: true }
      );
    }
  }

  return workspaces.length;
}

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      const count = await seedPermissions(process.argv[2]);
      console.log(`Seeded permissions for ${count} workspace(s).`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedPermissions;
