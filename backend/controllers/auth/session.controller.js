const asyncHandler = require("../../utils/asyncHandler");

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { getMe };
