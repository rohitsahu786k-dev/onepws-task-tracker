const express = require('express');
const passport = require('passport');
const router = express.Router();

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { authRateLimit } = require('../config/rateLimiter');

// Controllers (split into individual files per spec)
const { register } = require('../controllers/auth/register.controller');
const { login } = require('../controllers/auth/login.controller');
const { logout } = require('../controllers/auth/logout.controller');
const { refreshToken } = require('../controllers/auth/refresh.controller');
const { getMe } = require('../controllers/auth/session.controller');
const { googleCallback } = require('../controllers/auth/google.controller');

// Validators
const { registerRules, loginRules } = require('../validators/auth.validator');

// ── Local Auth ────────────────────────────────────────────────────────────────
router.post('/register', authRateLimit, registerRules, validate, register);
router.post('/login', authRateLimit, loginRules, validate, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=google_auth_failed`,
  }),
  googleCallback
);

module.exports = router;
