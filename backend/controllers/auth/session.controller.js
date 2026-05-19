const Session = require('../../models/Session');
const asyncHandler = require('../../utils/asyncHandler');
const authService = require('../../services/auth.service');
const sessionService = require('../../services/session.service');
const tokenService = require('../../services/token.service');

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: await authService.buildUserPayload(req.user) }, user: await authService.buildUserPayload(req.user) });
});

const listSessions = asyncHandler(async (req, res) => {
  const currentHash = sessionService.readRefreshToken(req)
    ? tokenService.hashToken(sessionService.readRefreshToken(req))
    : null;
  const sessions = await Session.find({
    user: req.user._id,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActiveAt: -1, createdAt: -1 });

  res.json({
    success: true,
    data: sessions.map((session) => ({
      ...session.toObject(),
      isCurrent: currentHash ? session.refreshTokenHash === currentHash : false,
      refreshTokenHash: undefined
    }))
  });
});

const revokeSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.sessionId, user: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

  session.isRevoked = true;
  session.revokedAt = new Date();
  session.revokedReason = 'manual_revoke';
  await session.save();

  res.json({ success: true, message: 'Session revoked successfully' });
});

module.exports = { getMe, listSessions, revokeSession };
