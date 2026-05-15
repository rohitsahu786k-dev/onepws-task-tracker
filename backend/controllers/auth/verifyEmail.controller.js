const asyncHandler = require('../../utils/asyncHandler');

const verifyEmail = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Email verification request accepted.' });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Verification email queued.' });
});

module.exports = { verifyEmail, resendVerificationEmail };
