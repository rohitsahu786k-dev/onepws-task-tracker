/**
 * Middleware: Enforce IP whitelist for API keys.
 * If allowedIps is set on the key, only those IPs may use it.
 */
function apiIpWhitelist(req, res, next) {
  const allowedIps = req.apiKey?.allowedIps || [];

  if (!allowedIps.length) {
    // No restriction configured
    return next();
  }

  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip ||
    req.connection?.remoteAddress;

  if (!allowedIps.includes(clientIp)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'API_IP_NOT_ALLOWED',
        message: `IP address ${clientIp} is not allowed for this API key`,
      },
    });
  }

  return next();
}

module.exports = apiIpWhitelist;
