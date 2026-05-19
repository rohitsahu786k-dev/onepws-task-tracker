const APIKeyUsageLog = require('../models/APIKeyUsageLog');

/**
 * Log a single API key usage entry
 */
async function log({ apiKey, method, path, statusCode, responseTimeMs, ipAddress, userAgent, requestId, errorCode, errorMessage }) {
  try {
    await APIKeyUsageLog.create({
      workspace: apiKey.workspace,
      apiKey: apiKey._id,
      keyPrefix: apiKey.keyPrefix,
      method,
      path,
      statusCode,
      responseTimeMs,
      ipAddress,
      userAgent,
      requestId,
      errorCode,
      errorMessage,
    });
  } catch (err) {
    // Non-blocking — never let logging fail an API request
    console.error('[apiKeyUsage] Failed to log usage:', err.message);
  }
}

module.exports = { log };
