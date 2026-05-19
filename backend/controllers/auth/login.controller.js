const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const tokenService = require('../../services/token.service');
const sessionService = require('../../services/session.service');
const authService = require('../../services/auth.service');
const loginSecurityService = require('../../services/loginSecurity.service');

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password +twoFactorSecret');
  if (!user || !user.password) {
    await loginSecurityService.recordFailedAttempt({ email: normalizedEmail, req });
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive || ['inactive', 'suspended'].includes(user.status)) {
    return res.status(403).json({ success: false, message: 'Your account is inactive or suspended' });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await loginSecurityService.recordAttempt({ user, req, status: 'blocked', reason: 'account_locked' });
    return res.status(423).json({ success: false, message: 'Account temporarily locked. Try again later.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await loginSecurityService.handleFailedLogin(user, req);
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (process.env.ENABLE_EMAIL_VERIFICATION !== 'false' && !user.isEmailVerified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before login' });
  }

  if (user.twoFactorEnabled) {
    return res.json({
      success: true,
      requiresTwoFactor: true,
      tempToken: tokenService.generateTwoFactorTempToken(user)
    });
  }

  const tokens = await tokenService.createLoginSession({ user, req, rememberMe });
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save({ validateBeforeSave: false });
  await loginSecurityService.recordSuccess(user, req);

  res.cookie('refreshToken', tokens.refreshToken, sessionService.refreshCookieOptions(rememberMe));
  res.json({
    success: true,
    message: 'Login successful',
    data: { accessToken: tokens.accessToken, user: await authService.buildUserPayload(user) },
    accessToken: tokens.accessToken,
    user: await authService.buildUserPayload(user)
  });
});

module.exports = { login };
