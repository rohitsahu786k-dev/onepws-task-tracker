const jwt = require('jsonwebtoken');

const requireRefreshToken = (req, res, next) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token is required' });
  try {
    req.refreshTokenPayload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    req.refreshToken = token;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

module.exports = requireRefreshToken;
module.exports.requireRefreshToken = requireRefreshToken;
