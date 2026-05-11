const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  googleCallback,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerRules, loginRules } = require('../middleware/validators');

// ─── Local Auth ───────────────────────────────────────────────────────────────
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
  googleCallback
);

router.get('/google/failure', (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/auth/login?error=google_auth_failed`);
});

module.exports = router;
