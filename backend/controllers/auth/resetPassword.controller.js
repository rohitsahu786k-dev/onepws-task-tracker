const PasswordResetToken = require('../../models/PasswordResetToken');
const Session = require('../../models/Session');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const tokenService = require('../../services/token.service');
const { validatePassword } = require('../../services/password.service');

const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (password !== (confirmPassword || password)) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  const record = await PasswordResetToken.findOne({
    tokenHash: tokenService.hashToken(req.params.token),
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });

  const user = await User.findById(record.user).select('+password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const passwordError = validatePassword(password, user.email);
  if (passwordError) return res.status(400).json({ success: false, message: passwordError });

  user.password = password;
  user.passwordChangedAt = new Date();
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.mustChangePassword = false;
  await user.save();

  record.used = true;
  record.usedAt = new Date();
  await record.save();

  await Session.updateMany(
    { user: user._id, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: 'password_reset' }
  );

  res.json({ success: true, message: 'Password reset successful. Please login again.' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== (confirmPassword || newPassword)) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  if (await user.comparePassword(newPassword)) {
    return res.status(400).json({ success: false, message: 'New password must be different from current password' });
  }

  const passwordError = validatePassword(newPassword, user.email);
  if (passwordError) return res.status(400).json({ success: false, message: passwordError });

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  await user.save();

  await Session.updateMany(
    { user: user._id, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: 'password_changed' }
  );

  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Password changed successfully. Please login again.' });
});

module.exports = { resetPassword, changePassword };
