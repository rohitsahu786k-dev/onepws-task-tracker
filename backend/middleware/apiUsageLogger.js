const apiKeyUsageService = require('../services/apiKeyUsage.service');

/**
 * Middleware: Log API key usage after response finishes.
 * Attaches to the response 'finish' event for accurate status codes.
 */
function apiUsageLogger(req, res, next) {
  if (!req.apiKey) return next();

  const start = Date.now();

  res.on('finish', () => {
    apiKeyUsageService.log({
      apiKey: req.apiKey,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: Date.now() - start,
      ipAddress:
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.ip ||
        req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      requestId: req.id || req.headers['x-request-id'],
    });
  });

  return next();
}

module.exports = apiUsageLogger;
