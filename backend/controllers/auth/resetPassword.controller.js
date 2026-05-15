const asyncHandler = require('../../utils/asyncHandler');

const resetPassword = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Password reset request accepted.' });
});

module.exports = { resetPassword };
