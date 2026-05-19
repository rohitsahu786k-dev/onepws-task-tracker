const wikiController = require('./wiki.controller');

module.exports = {
  list: wikiController.templates,
  getAll: wikiController.templates,
  create: wikiController.createTemplate,
  getById: wikiController.getTemplate,
  update: wikiController.updateTemplate,
  remove: wikiController.deleteTemplate,
  delete: wikiController.deleteTemplate,
  setDefault: wikiController.setDefaultTemplate,
  clone: wikiController.cloneTemplate,
  createArticle: wikiController.create,
};
