const dayjs = require('dayjs');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const tokenService = require('./token.service');

async function sendVerificationEmail(user) {
  const rawToken = tokenService.generateOpaqueToken(32);
  await EmailVerificationToken.create({
    user: user._id,
    tokenHash: tokenService.hashToken(rawToken),
    expiresAt: dayjs().add(24, 'hour').toDate()
  });

  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${rawToken}`;
  console.info(`[auth] Verification link for ${user.email}: ${verificationUrl}`);
  return { rawToken, verificationUrl };
}

module.exports = { sendVerificationEmail };
