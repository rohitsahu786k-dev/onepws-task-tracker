const crypto = require('crypto');
const axios = require('axios');

/**
 * Generate a random webhook secret string.
 */
function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Simple POST to a webhook URL (legacy helper).
 */
const postWebhook = async (url, payload, headers = {}) => {
  if (!url) throw new Error('Webhook URL is required');
  const response = await axios.post(url, payload, { headers, timeout: 15000 });
  return { status: response.status, data: response.data };
};

/**
 * Validate that a URL is safe to use as a webhook endpoint.
 * Blocks private/localhost URLs in production.
 */
function isPrivateUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (blockedHosts.includes(hostname)) return true;
    // Block RFC-1918 ranges (simplified check)
    if (/^10\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
    return false;
  } catch {
    return true; // invalid URL = treat as private
  }
}

module.exports = { postWebhook, generateSecret, isPrivateUrl };
