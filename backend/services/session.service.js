const Session = require('../models/Session');
const tokenService = require('./token.service');

function refreshCookieOptions(rememberMe = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  };
}

function readRefreshToken(req) {
  if (req.cookies?.refreshToken) return req.cookies.refreshToken;
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : req.body?.refreshToken;
}

async function revokeRefreshToken(rawToken, reason = 'revoked') {
  if (!rawToken) return null;
  return Session.findOneAndUpdate(
    { refreshTokenHash: tokenService.hashToken(rawToken), isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    { new: true }
  );
}

module.exports = { refreshCookieOptions, readRefreshToken, revokeRefreshToken };
