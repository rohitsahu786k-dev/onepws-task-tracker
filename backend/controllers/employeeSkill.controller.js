const employeeController = require('./employee.controller');

module.exports = {
  list: employeeController.skills,
  getAll: employeeController.skills,
  create: employeeController.addSkill,
  update: employeeController.updateSkill,
  remove: employeeController.removeSkill,
  delete: employeeController.removeSkill,
};
