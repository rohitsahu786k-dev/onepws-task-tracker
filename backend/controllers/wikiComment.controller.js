const wikiController = require('./wiki.controller');

module.exports = {
  list: wikiController.comments,
  getAll: wikiController.comments,
  create: wikiController.addComment,
  update: wikiController.updateComment,
  remove: wikiController.deleteComment,
  delete: wikiController.deleteComment,
  resolve: wikiController.resolveComment,
};
