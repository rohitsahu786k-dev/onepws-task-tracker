const { generateAccessToken, generateRefreshToken } = require("../../utils/generateToken");
const asyncHandler = require("../../utils/asyncHandler");

const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.redirect(
    `${process.env.CLIENT_URL}/auth/google/success?accessToken=${accessToken}&refreshToken=${refreshToken}`
  );
});

module.exports = { googleCallback };
