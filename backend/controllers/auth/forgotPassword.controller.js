const asyncHandler = require('../../utils/asyncHandler');

const forgotPassword = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'If an account exists for this email, password reset instructions will be sent.',
  });
});

module.exports = { forgotPassword };
