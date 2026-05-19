const crypto = require('crypto');

/**
 * Generate a raw API key in format: opws_{env}_{32-byte-hex}
 */
function generateApiKey(environment = 'live') {
  const secret = crypto.randomBytes(32).toString('hex');
  return `opws_${environment}_${secret}`;
}

/**
 * Get a display prefix from a raw API key (first 16 chars)
 */
function getKeyPrefix(rawKey) {
  return rawKey.slice(0, 16);
}

/**
 * Hash a raw API key using SHA-256 for secure storage
 */
function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generate a random webhook secret
 */
function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Mark an API key as used (update lastUsedAt, lastUsedIp, usageCount)
 */
async function markUsed({ apiKey, ipAddress }) {
  apiKey.lastUsedAt = new Date();
  if (ipAddress) apiKey.lastUsedIp = ipAddress;
  apiKey.usageCount = (apiKey.usageCount || 0) + 1;
  await apiKey.save();
}

module.exports = {
  generateApiKey,
  getKeyPrefix,
  hashApiKey,
  generateWebhookSecret,
  markUsed,
};
