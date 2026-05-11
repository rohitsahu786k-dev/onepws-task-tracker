const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const secret = process.env.FIELD_ENCRYPTION_KEY || process.env.JWT_SECRET || 'onepws-development-field-key';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptField(value) {
  if (!value) return value;
  if (String(value).startsWith('enc:')) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

module.exports = encryptField;
