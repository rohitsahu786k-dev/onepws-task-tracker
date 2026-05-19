const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', 'qwerty123', 'admin123', 'welcome123', 'onepws123'
]);

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validatePassword(password, email = '') {
  if (!passwordRegex.test(password || '')) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
  }
  if (email && String(password).toLowerCase().includes(String(email).split('@')[0].toLowerCase())) {
    return 'Password cannot contain your email name';
  }
  if (COMMON_PASSWORDS.has(String(password).toLowerCase())) {
    return 'Password is too common';
  }
  return null;
}

module.exports = { validatePassword, passwordRegex };
