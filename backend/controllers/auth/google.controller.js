const asyncHandler = require('../../utils/asyncHandler');
const tokenService = require('../../services/token.service');
const sessionService = require('../../services/session.service');

const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user.isActive || user.status === 'suspended') {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_blocked`);
  }

  const tokens = await tokenService.createLoginSession({ user, req, rememberMe: true });
  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', tokens.refreshToken, sessionService.refreshCookieOptions(true));
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/google/callback?accessToken=${tokens.accessToken}`);
});

module.exports = { googleCallback };
