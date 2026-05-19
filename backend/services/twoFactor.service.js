const crypto = require('crypto');
const tokenService = require('./token.service');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  return bits.match(/.{1,5}/g).map((chunk) => BASE32_ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)]).join('');
}

function base32Decode(secret) {
  const clean = String(secret || '').replace(/=+$/g, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val >= 0) bits += val.toString(2).padStart(5, '0');
  }
  const bytes = bits.match(/.{8}/g) || [];
  return Buffer.from(bytes.map((byte) => parseInt(byte, 2)));
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function generateTotp(secret, step = Math.floor(Date.now() / 30000)) {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
  return code;
}

function verifyTotp(secret, token) {
  const current = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((offset) => generateTotp(secret, current + offset) === String(token).padStart(6, '0'));
}

function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
}

function hashBackupCode(code) {
  return tokenService.hashToken(String(code).toUpperCase());
}

module.exports = { generateSecret, verifyTotp, generateBackupCodes, hashBackupCode };
