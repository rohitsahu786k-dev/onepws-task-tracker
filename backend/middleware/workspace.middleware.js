const { verifyWorkspaceAccess } = require('./auth.middleware');

const attachWorkspace = verifyWorkspaceAccess;

module.exports = attachWorkspace;
module.exports.attachWorkspace = attachWorkspace;
module.exports.verifyWorkspaceAccess = verifyWorkspaceAccess;
