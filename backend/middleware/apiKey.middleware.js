const crypto = require('crypto');
const APIKey = require('../models/ApiKey');

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

const authenticateApiKey = async (req, res, next) => {
  try {
    const rawKey = req.get('x-api-key') || req.query.apiKey;
    if (!rawKey) return next();
    const apiKey = await APIKey.findOne({ keyHash: hashKey(rawKey), isActive: true });
    if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
      return res.status(401).json({ success: false, message: 'Invalid or expired API key' });
    }
    apiKey.lastUsedAt = new Date();
    await apiKey.save();
    req.apiKey = apiKey;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateApiKey;
module.exports.authenticateApiKey = authenticateApiKey;
module.exports.hashApiKey = hashKey;
