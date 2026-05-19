const crypto = require('crypto');

const algorithm = 'aes-256-gcm';

function getKey() {
  const configured = process.env.SETTINGS_ENCRYPTION_KEY;
  if (configured && configured.length === 64) return Buffer.from(configured, 'hex');
  return crypto.createHash('sha256').update(process.env.JWT_SECRET || 'onepws-dev-settings-key').digest();
}

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
  if (!encryptedText || !String(encryptedText).includes(':')) return encryptedText;
  const [ivHex, authTagHex, encrypted] = String(encryptedText).split(':');
  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function maskSecret(value) {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 8) return '********';
  return `${text.slice(0, 4)}********${text.slice(-4)}`;
}

module.exports = { encrypt, decrypt, maskSecret };
