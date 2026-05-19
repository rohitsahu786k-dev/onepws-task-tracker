const User = require('../../models/User');
const QRCode = require('qrcode');
const asyncHandler = require('../../utils/asyncHandler');
const twoFactorService = require('../../services/twoFactor.service');
const tokenService = require('../../services/token.service');
const sessionService = require('../../services/session.service');
const authService = require('../../services/auth.service');

const getTwoFactorStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { enabled: Boolean(req.user?.twoFactorEnabled) } });
});

const setupTwoFactor = asyncHandler(async (req, res) => {
  const secret = twoFactorService.generateSecret();
  const otpauthUrl = `otpauth://totp/ONEPWS:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=ONEPWS`;
  await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret });
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
  res.json({ success: true, data: { secret, qrCodeUrl, otpauthUrl } });
});

const verifyTwoFactor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+twoFactorSecret');
  if (!user?.twoFactorSecret || !twoFactorService.verifyTotp(user.twoFactorSecret, req.body.token)) {
    return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
  }

  const backupCodes = twoFactorService.generateBackupCodes();
  user.twoFactorEnabled = true;
  user.backupCodes = backupCodes.map((code) => ({ codeHash: twoFactorService.hashBackupCode(code) }));
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Two-factor authentication enabled.', data: { backupCodes } });
});

const disableTwoFactor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+twoFactorSecret +password');
  if (user.twoFactorSecret && req.body.token && !twoFactorService.verifyTotp(user.twoFactorSecret, req.body.token)) {
    return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
  }
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.backupCodes = [];
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Two-factor authentication disabled.' });
});

const loginWithTwoFactor = asyncHandler(async (req, res) => {
  const decoded = tokenService.verifyTwoFactorTempToken(req.body.tempToken);
  if (decoded.purpose !== '2fa_login') return res.status(401).json({ success: false, message: 'Invalid 2FA token' });

  const user = await User.findById(decoded.id).select('+twoFactorSecret +backupCodes');
  if (!user || !user.twoFactorEnabled) return res.status(401).json({ success: false, message: 'Invalid 2FA state' });

  const code = String(req.body.code || '').trim();
  let verified = twoFactorService.verifyTotp(user.twoFactorSecret, code);
  if (!verified) {
    const codeHash = twoFactorService.hashBackupCode(code);
    const backupCode = user.backupCodes.find((item) => item.codeHash === codeHash && !item.used);
    if (backupCode) {
      backupCode.used = true;
      backupCode.usedAt = new Date();
      verified = true;
    }
  }
  if (!verified) return res.status(400).json({ success: false, message: 'Invalid 2FA code' });

  const tokens = await tokenService.createLoginSession({ user, req, rememberMe: true });
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', tokens.refreshToken, sessionService.refreshCookieOptions(true));
  res.json({
    success: true,
    message: 'Login successful',
    data: { accessToken: tokens.accessToken, user: await authService.buildUserPayload(user) },
    accessToken: tokens.accessToken,
    user: await authService.buildUserPayload(user)
  });
});

const useBackupCode = loginWithTwoFactor;

module.exports = {
  getTwoFactorStatus,
  setupTwoFactor,
  enableTwoFactor: setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  loginWithTwoFactor,
  useBackupCode
};
