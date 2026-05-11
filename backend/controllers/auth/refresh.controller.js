const User = require("../../models/User");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../../utils/generateToken");
const asyncHandler = require("../../utils/asyncHandler");

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: "Refresh token required." });

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== token) {
    return res.status(401).json({ success: false, message: "Invalid refresh token." });
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
});

module.exports = { refreshToken };
