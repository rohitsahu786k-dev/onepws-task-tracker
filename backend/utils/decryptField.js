const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const secret = process.env.FIELD_ENCRYPTION_KEY || process.env.JWT_SECRET || 'onepws-development-field-key';
  return crypto.createHash('sha256').update(secret).digest();
}

function decryptField(value) {
  if (!value) return value;

  if (!value.startsWith('enc:')) {
    return value;
  }

  const [, ivHex, authTagHex, encryptedHex] = value.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

module.exports = decryptField;
