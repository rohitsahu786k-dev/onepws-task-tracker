const User = require("../../models/User");
const { generateAccessToken, generateRefreshToken } = require("../../utils/generateToken");
const asyncHandler = require("../../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already registered." });
  }

  const assignedRole =
    req.user?.role === "super_admin" ? role || "employee" : "employee";

  const user = await User.create({ name, email, password, role: assignedRole });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    accessToken,
    refreshToken,
    user,
  });
});

module.exports = { register };
