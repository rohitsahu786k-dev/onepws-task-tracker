const contentItemController = require('./contentItem.controller');

module.exports = {
  update: contentItemController.updatePerformance,
  get: contentItemController.getPerformance
};
