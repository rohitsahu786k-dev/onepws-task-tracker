const NoteActivity = require('../models/NoteActivity');

async function log(payload) {
  if (!payload?.workspace || !payload?.note || !payload?.action) return null;
  try {
    return await NoteActivity.create(payload);
  } catch (error) {
    console.warn('[noteActivity] failed:', error.message);
    return null;
  }
}

module.exports = { log };
