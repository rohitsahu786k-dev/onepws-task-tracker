const asyncHandler = require('../../utils/asyncHandler');

const getTwoFactorStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { enabled: Boolean(req.user?.twoFactorEnabled) } });
});

const enableTwoFactor = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Two-factor setup initialized.' });
});

const verifyTwoFactor = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Two-factor verification accepted.' });
});

const disableTwoFactor = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Two-factor authentication disabled.' });
});

module.exports = { getTwoFactorStatus, enableTwoFactor, verifyTwoFactor, disableTwoFactor };
