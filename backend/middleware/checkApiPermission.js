/**
 * Middleware: Check that the authenticated API key has a specific permission.
 * Usage: router.post('/tasks', verifyApiKey, checkApiPermission('tasks:create'), handler)
 */
function checkApiPermission(permission) {
  return function (req, res, next) {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'API_KEY_MISSING',
          message: 'API key authentication required',
        },
      });
    }

    const permissions = req.apiKey.permissions || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'API_PERMISSION_DENIED',
          message: `API key does not have permission: ${permission}`,
        },
      });
    }

    return next();
  };
}

module.exports = checkApiPermission;
