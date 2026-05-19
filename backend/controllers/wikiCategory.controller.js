const wikiController = require('./wiki.controller');

module.exports = {
  list: wikiController.categories,
  getAll: wikiController.categories,
  create: wikiController.createCategory,
  getById: wikiController.getCategory,
  update: wikiController.updateCategory,
  remove: wikiController.deleteCategory,
  delete: wikiController.deleteCategory,
  archive: wikiController.deleteCategory,
  restore: wikiController.updateCategory,
  move: wikiController.updateCategory,
  reorder: wikiController.categories,
  articles: wikiController.categoryArticles,
};
