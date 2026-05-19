const PrintJobActivity = require('../models/PrintJobActivity');

function log(payload) {
  return PrintJobActivity.create(payload).catch(() => null);
}

module.exports = { log };
