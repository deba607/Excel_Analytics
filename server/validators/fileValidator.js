const { body } = require('express-validator');

const fileValidator = [
  body('gridFsId')
    .notEmpty().withMessage('GridFS file ID is required'),
  body('originalName')
    .notEmpty().withMessage('Original file name is required'),
  body('size')
    .isNumeric().withMessage('File size must be a number'),
  body('userEmail')
    .notEmpty().withMessage('User email is required'),
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed'])
    .withMessage('Invalid status'),
  body('columns')
    .optional()
    .isArray().withMessage('Columns must be an array'),
];

module.exports = { fileValidator }; 