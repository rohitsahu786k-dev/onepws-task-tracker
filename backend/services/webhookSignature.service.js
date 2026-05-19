const crypto = require('crypto');

/**
 * Generate HMAC-SHA256 signature for a webhook payload.
 * signedPayload = "{timestamp}.{JSON.stringify(payload)}"
 */
function generateSignature({ payload, secret, timestamp }) {
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  return crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
}

/**
 * Verify an incoming webhook signature (for use by external systems).
 */
function verifySignature({ payload, secret, timestamp, signature }) {
  const expected = generateSignature({ payload, secret, timestamp });
  return signature === `sha256=${expected}`;
}

module.exports = { generateSignature, verifySignature };
