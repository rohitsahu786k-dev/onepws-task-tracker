const passport = require('passport');

/**
 * Authenticate via JWT — attach user to req.user
 */
const protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Unauthorized. Please login.',
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Authorize by role(s)
 * Usage: authorize('admin', 'super_admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
