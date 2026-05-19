const WikiActivity = require('../models/WikiActivity');

async function log(payload) {
  if (!payload?.workspace || !payload?.article || !payload?.action) return null;
  try {
    return await WikiActivity.create(payload);
  } catch (error) {
    console.warn('[wikiActivity] failed:', error.message);
    return null;
  }
}

module.exports = { log };
