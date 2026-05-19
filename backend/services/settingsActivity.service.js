const SettingsActivity = require('../models/SettingsActivity');

function maskValue(value) {
  if (!value || typeof value !== 'object') return value;
  const copy = Array.isArray(value) ? [...value] : { ...value };
  Object.keys(copy).forEach((key) => {
    if (/password|secret|token|apiKey|webhook/i.test(key)) copy[key] = '********';
    else if (copy[key] && typeof copy[key] === 'object') copy[key] = maskValue(copy[key]);
  });
  return copy;
}

async function log(payload) {
  try {
    return await SettingsActivity.create({
      ...payload,
      oldValue: maskValue(payload.oldValue),
      newValue: maskValue(payload.newValue),
    });
  } catch (error) {
    console.warn('[settingsActivity] failed:', error.message);
    return null;
  }
}

module.exports = { log };
