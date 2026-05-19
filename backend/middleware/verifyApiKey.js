const crypto = require('crypto');
const APIKey = require('../models/APIKey');
const apiKeyService = require('../services/apiKey.service');

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

/**
 * Middleware: Verify incoming API key from headers.
 * Supports: Authorization: Bearer <key> or X-API-Key: <key>
 */
async function verifyApiKey(req, res, next) {
  try {
    const rawKey =
      req.headers['x-api-key'] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!rawKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'API_KEY_MISSING',
          message: 'API key is required',
        },
      });
    }

    const keyHash = hashKey(rawKey);
    const apiKey = await APIKey.findOne({ keyHash });

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'API_KEY_INVALID',
          message: 'Invalid API key',
        },
      });
    }

    if (apiKey.status === 'revoked') {
      return res.status(401).json({
        success: false,
        error: { code: 'API_KEY_REVOKED', message: 'API key has been revoked' },
      });
    }

    if (apiKey.status === 'disabled') {
      return res.status(401).json({
        success: false,
        error: { code: 'API_KEY_DISABLED', message: 'API key is disabled' },
      });
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.status = 'expired';
      await apiKey.save();
      return res.status(401).json({
        success: false,
        error: { code: 'API_KEY_EXPIRED', message: 'API key has expired' },
      });
    }

    if (apiKey.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: { code: 'API_KEY_INACTIVE', message: 'API key is not active' },
      });
    }

    req.apiKey = apiKey;
    req.workspaceId = apiKey.workspace;

    // Non-blocking usage tracking
    apiKeyService
      .markUsed({ apiKey, ipAddress: req.ip })
      .catch((e) => console.error('[verifyApiKey] markUsed error:', e.message));

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = verifyApiKey;
module.exports.verifyApiKey = verifyApiKey;
module.exports.hashApiKey = hashKey;
