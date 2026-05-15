const normalizeIp = (ip = '') => ip.replace(/^::ffff:/, '');

const ipWhitelist = (allowed = []) => (req, res, next) => {
  if (!allowed.length) return next();
  const clientIp = normalizeIp(req.ip || req.connection?.remoteAddress);
  if (!allowed.map(normalizeIp).includes(clientIp)) {
    return res.status(403).json({ success: false, message: 'IP address is not allowed' });
  }
  next();
};

module.exports = ipWhitelist;
module.exports.ipWhitelist = ipWhitelist;
