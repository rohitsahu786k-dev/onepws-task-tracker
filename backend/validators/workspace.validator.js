const { body, param, query } = require('express-validator');

const idParam = [param('id').optional().isMongoId().withMessage('Invalid id')];
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
];
const createRules = [body().isObject().withMessage('Request body must be an object')];
const updateRules = [...idParam, body().isObject().withMessage('Request body must be an object')];

module.exports = {
  idParam,
  paginationRules,
  createRules,
  updateRules,
};
