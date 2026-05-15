const crypto = require('crypto');

const generateOTP = (length = 6) => {
  const max = 10 ** length;
  return String(crypto.randomInt(0, max)).padStart(length, '0');
};

module.exports = generateOTP;
