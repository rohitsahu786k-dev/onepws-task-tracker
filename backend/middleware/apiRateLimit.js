// In-memory rate limiter per API key (per minute).
// For production, replace with Redis-backed solution.
const rateMap = new Map();

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Math.floor(Date.now() / 60000);
  for (const key of rateMap.keys()) {
    const keyMinute = parseInt(key.split(':')[1], 10);
    if (now - keyMinute > 10) {
      rateMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Middleware: Enforce per-minute rate limit for API keys.
 */
function apiRateLimit(req, res, next) {
  if (!req.apiKey) return next();

  const rateConfig = req.apiKey.rateLimit;
  if (!rateConfig?.enabled) return next();

  const apiKeyId = req.apiKey._id.toString();
  const minuteKey = `${apiKeyId}:${Math.floor(Date.now() / 60000)}`;
  const limit = rateConfig.requestsPerMinute || 60;

  const current = rateMap.get(minuteKey) || 0;

  if (current >= limit) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'API_RATE_LIMITED',
        message: 'Rate limit exceeded. Please slow down your requests.',
      },
      retryAfter: 60 - (Date.now() % 60000) / 1000,
    });
  }

  rateMap.set(minuteKey, current + 1);
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', limit - current - 1);

  return next();
}

module.exports = apiRateLimit;
