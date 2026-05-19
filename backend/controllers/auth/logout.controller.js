const Session = require('../../models/Session');
const asyncHandler = require('../../utils/asyncHandler');
const sessionService = require('../../services/session.service');

const logout = asyncHandler(async (req, res) => {
  await sessionService.revokeRefreshToken(sessionService.readRefreshToken(req), 'user_logout');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

const logoutAll = asyncHandler(async (req, res) => {
  await Session.updateMany(
    { user: req.user._id, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout_all_devices' }
  );
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out from all devices' });
});

module.exports = { logout, logoutAll };
