const jwt = require('jsonwebtoken');

const signAccessToken = (payload, options = {}) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m', ...options });

const signRefreshToken = (payload, options = {}) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', ...options });

module.exports = { signAccessToken, signRefreshToken };
