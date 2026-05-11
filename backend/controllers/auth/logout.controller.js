const User = require("../../models/User");
const asyncHandler = require("../../utils/asyncHandler");

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.json({ success: true, message: "Logged out successfully." });
});

module.exports = { logout };
