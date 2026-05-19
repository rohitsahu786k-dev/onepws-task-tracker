const Session = require('../../models/Session');
const asyncHandler = require('../../utils/asyncHandler');
const tokenService = require('../../services/token.service');
const sessionService = require('../../services/session.service');

const refreshToken = asyncHandler(async (req, res) => {
  const rawToken = sessionService.readRefreshToken(req);
  if (!rawToken) return res.status(401).json({ success: false, message: 'Refresh token missing' });

  const session = await Session.findOne({
    refreshTokenHash: tokenService.hashToken(rawToken),
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).populate('user');

  if (!session || !session.user || !session.user.isActive || session.user.status === 'suspended') {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  session.lastActiveAt = new Date();
  await session.save();

  const accessToken = tokenService.generateAccessToken(session.user);
  res.json({ success: true, data: { accessToken }, accessToken });
});

module.exports = { refreshToken };
