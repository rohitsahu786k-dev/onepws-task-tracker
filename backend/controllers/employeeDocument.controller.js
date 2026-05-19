const employeeController = require('./employee.controller');

module.exports = {
  list: employeeController.documents,
  getAll: employeeController.documents,
  create: employeeController.addDocument,
  remove: employeeController.deleteDocument,
  delete: employeeController.deleteDocument,
  verify: employeeController.verifyDocument,
};
