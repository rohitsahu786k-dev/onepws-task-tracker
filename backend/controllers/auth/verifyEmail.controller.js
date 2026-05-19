const EmailVerificationToken = require('../../models/EmailVerificationToken');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const tokenService = require('../../services/token.service');
const emailVerificationService = require('../../services/emailVerification.service');

const verifyEmail = asyncHandler(async (req, res) => {
  const record = await EmailVerificationToken.findOne({
    tokenHash: tokenService.hashToken(req.params.token),
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });

  const user = await User.findById(record.user);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  user.status = 'active';
  await user.save({ validateBeforeSave: false });

  record.used = true;
  record.usedAt = new Date();
  await record.save();

  res.json({ success: true, message: 'Email verified successfully' });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: true, message: 'If the account exists, verification email has been sent.' });
  if (user.isEmailVerified) return res.json({ success: true, message: 'Email is already verified.' });

  await emailVerificationService.sendVerificationEmail(user);
  res.json({ success: true, message: 'Verification email sent.' });
});

module.exports = { verifyEmail, resendVerificationEmail };
