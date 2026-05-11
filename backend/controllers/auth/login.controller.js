const User = require("../../models/User");
const { generateAccessToken, generateRefreshToken } = require("../../utils/generateToken");
const asyncHandler = require("../../utils/asyncHandler");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user || !user.password) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: "Account deactivated. Contact admin." });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "Login successful.", accessToken, refreshToken, user });
});

module.exports = { login };
