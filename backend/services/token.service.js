const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const Session = require('../models/Session');
const detectDevice = require('../utils/detectDevice');

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      globalRole: user.globalRole,
      role: user.role
    },
    process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function generateTwoFactorTempToken(user) {
  return jwt.sign(
    { id: user._id, purpose: '2fa_login' },
    process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    { expiresIn: '10m' }
  );
}

function verifyTwoFactorTempToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
}

async function createLoginSession({ user, req, rememberMe = false, workspace = null }) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const userAgent = req.headers['user-agent'] || '';
  const deviceName = detectDevice ? detectDevice(userAgent) : 'desktop';

  await Session.create({
    user: user._id,
    workspace,
    refreshTokenHash,
    deviceName,
    ipAddress: req.ip,
    userAgent,
    isCurrent: true,
    lastActiveAt: new Date(),
    expiresAt: rememberMe ? dayjs().add(30, 'day').toDate() : dayjs().add(7, 'day').toDate()
  });

  return { accessToken, refreshToken };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateOpaqueToken,
  generateTwoFactorTempToken,
  verifyTwoFactorTempToken,
  hashToken,
  createLoginSession
};
