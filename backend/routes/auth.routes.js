const express = require('express');
const passport = require('passport');
const router = express.Router();

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { authRateLimit } = require('../config/rateLimiter');

// Controllers (split into individual files per spec)
const { register } = require('../controllers/auth/register.controller');
const { login } = require('../controllers/auth/login.controller');
const { logout, logoutAll } = require('../controllers/auth/logout.controller');
const { refreshToken } = require('../controllers/auth/refresh.controller');
const { getMe, listSessions, revokeSession } = require('../controllers/auth/session.controller');
const { googleCallback } = require('../controllers/auth/google.controller');
const { forgotPassword } = require('../controllers/auth/forgotPassword.controller');
const { resetPassword, changePassword } = require('../controllers/auth/resetPassword.controller');
const { verifyEmail, resendVerificationEmail } = require('../controllers/auth/verifyEmail.controller');
const {
  setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  loginWithTwoFactor,
  useBackupCode
} = require('../controllers/auth/twoFactor.controller');

// Validators
const { registerRules, loginRules } = require('../validators/auth.validator');

// ── Local Auth ────────────────────────────────────────────────────────────────
router.post('/register', authRateLimit, registerRules, validate, register);
router.post('/login', authRateLimit, loginRules, validate, login);
router.post('/refresh', refreshToken);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.get('/me', protect, getMe);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password/:token', authRateLimit, resetPassword);
router.put('/change-password', protect, changePassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authRateLimit, resendVerificationEmail);
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/verify', protect, verifyTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);
router.post('/2fa/login', authRateLimit, loginWithTwoFactor);
router.post('/2fa/backup-code', authRateLimit, useBackupCode);
router.get('/sessions', protect, listSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
  }),
  googleCallback
);

module.exports = router;
