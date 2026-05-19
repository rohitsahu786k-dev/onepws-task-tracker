const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const { validatePassword } = require('../../services/password.service');
const emailVerificationService = require('../../services/emailVerification.service');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, phone, designation } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();

  if (password !== (confirmPassword || password)) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  const passwordError = validatePassword(password, normalizedEmail);
  if (passwordError) return res.status(400).json({ success: false, message: passwordError });

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    designation,
    authProvider: 'local',
    status: process.env.ENABLE_EMAIL_VERIFICATION === 'false' ? 'active' : 'pending_verification',
    isEmailVerified: process.env.ENABLE_EMAIL_VERIFICATION === 'false'
  });

  if (!user.isEmailVerified) {
    await emailVerificationService.sendVerificationEmail(user);
  }

  res.status(201).json({
    success: true,
    message: user.isEmailVerified
      ? 'Registration successful.'
      : 'Registration successful. Please verify your email.',
    data: { userId: user._id, email: user.email, isEmailVerified: user.isEmailVerified }
  });
});

module.exports = { register };
