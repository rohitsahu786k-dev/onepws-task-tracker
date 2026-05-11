const { RateLimiterMemory } = require('rate-limiter-flexible');

/**
 * Auth routes: strict (5 attempts / 15 min)
 */
const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60,
});

/**
 * General API: relaxed (100 req / 1 min)
 */
const apiLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

/**
 * File upload: 10 uploads / min
 */
const uploadLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

/**
 * Email/OTP: 3 per 10 min
 */
const emailLimiter = new RateLimiterMemory({
  points: 3,
  duration: 10 * 60,
  blockDuration: 10 * 60,
});

/**
 * Middleware factory
 */
const createLimiterMiddleware = (limiter, keyPrefix = '') => async (req, res, next) => {
  try {
    const key = keyPrefix + (req.ip || req.connection.remoteAddress);
    await limiter.consume(key);
    next();
  } catch (err) {
    const secs = Math.round(err.msBeforeNext / 1000) || 60;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: `Too many requests. Please try again in ${secs} seconds.`,
    });
  }
};

module.exports = {
  authRateLimit: createLimiterMiddleware(authLimiter, 'auth_'),
  apiRateLimit: createLimiterMiddleware(apiLimiter, 'api_'),
  uploadRateLimit: createLimiterMiddleware(uploadLimiter, 'upload_'),
  emailRateLimit: createLimiterMiddleware(emailLimiter, 'email_'),
};
