const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select('-password -refreshToken -twoFactorSecret');
        if (!user || !user.isActive || user.status === 'suspended') return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Google OAuth Strategy (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error('Google account email not found'), null);

          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              user.isGoogleAuth = true;
              user.isEmailVerified = true;
              user.emailVerifiedAt = user.emailVerifiedAt || new Date();
              if (user.status === 'pending_verification') user.status = 'active';
              if (!user.avatar && profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
              await user.save();
            } else {
              user = await User.create({
                googleId: profile.id,
                email,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
                authProvider: 'google',
                isGoogleAuth: true,
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
                status: 'active',
                isActive: true,
                role: 'member',
              });
            }
          }
          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth not configured — set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env');
}

module.exports = passport;
