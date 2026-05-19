const dayjs = require('dayjs');
const LoginAttempt = require('../models/LoginAttempt');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

async function recordAttempt({ email, user, req, status, reason }) {
  return LoginAttempt.create({
    email: String(email || user?.email || '').toLowerCase(),
    user: user?._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status,
    reason
  });
}

async function recordFailedAttempt({ email, req, reason = 'invalid_user' }) {
  return recordAttempt({ email, req, status: 'failed', reason });
}

async function handleFailedLogin(user, req) {
  user.failedLoginCount = (user.failedLoginCount || 0) + 1;
  let reason = 'invalid_password';
  if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
    user.lockedUntil = dayjs().add(LOCK_MINUTES, 'minute').toDate();
    reason = 'account_locked';
  }
  await user.save({ validateBeforeSave: false });
  await recordAttempt({ user, req, status: reason === 'account_locked' ? 'blocked' : 'failed', reason });
}

async function recordSuccess(user, req) {
  await recordAttempt({ user, req, status: 'success', reason: 'login_success' });
}

module.exports = { recordAttempt, recordFailedAttempt, handleFailedLogin, recordSuccess };
