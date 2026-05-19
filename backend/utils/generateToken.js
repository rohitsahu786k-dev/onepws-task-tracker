const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev_jwt_secret_change_me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_refresh_secret_change_me', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_refresh_secret_change_me');

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };
