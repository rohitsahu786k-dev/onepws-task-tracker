const dayjs = require('dayjs');
const PasswordResetToken = require('../../models/PasswordResetToken');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const tokenService = require('../../services/token.service');

const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email });

  if (user) {
    const rawToken = tokenService.generateOpaqueToken(32);
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: tokenService.hashToken(rawToken),
      expiresAt: dayjs().add(1, 'hour').toDate(),
      ipAddress: req.ip
    });
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
    console.info(`[auth] Password reset link for ${user.email}: ${resetUrl}`);
  }

  res.json({ success: true, message: 'If the account exists, a password reset link has been sent.' });
});

module.exports = { forgotPassword };
