const rateLimit = ({ windowMs = 60000, max = 120 } = {}) => {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || 'anonymous';
    const now = Date.now();
    const record = hits.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }
    record.count += 1;
    hits.set(key, record);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(max - record.count, 0));
    if (record.count > max) {
      return res.status(429).json({ success: false, message: 'Too many requests' });
    }
    next();
  };
};

module.exports = rateLimit;
module.exports.rateLimit = rateLimit;
