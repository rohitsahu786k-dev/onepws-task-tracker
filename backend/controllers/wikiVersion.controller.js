const wikiController = require('./wiki.controller');

module.exports = {
  list: wikiController.versions,
  getAll: wikiController.versions,
  create: wikiController.createVersion,
  restore: wikiController.restoreVersion,
};
