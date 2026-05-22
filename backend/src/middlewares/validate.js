const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { sendError } = require('../utils/response');
const { normalizePhoneNumber } = require('../utils/duplicateUtils');
const { SEARCH_MODES } = require('../utils/searchUtils');

const handleValidation = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return sendError(res, 422, 'Validation failed.', result.array());
};

const objectIdParam = (field = 'id') =>
  param(field).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid contact id.');
    }
    return true;
  });

const contactRules = [
  body('name')
    .exists({ checkFalsy: true })
    .withMessage('Name is required.')
    .bail()
    .isString()
    .withMessage('Name must be a string.')
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name must contain at least one character.'),
  body('phoneNumbers')
    .isArray({ min: 1 })
    .withMessage('At least one phone number is required.'),
  body('phoneNumbers.*.label')
    .optional()
    .isString()
    .withMessage('Phone label must be a string.')
    .isLength({ max: 40 })
    .withMessage('Phone label cannot exceed 40 characters.'),
  body('phoneNumbers.*.number')
    .exists({ checkFalsy: true })
    .withMessage('Phone number is required.')
    .bail()
    .isString()
    .withMessage('Phone number must be a string.')
    .bail()
    .custom((value) => {
      if (!normalizePhoneNumber(value)) {
        throw new Error('Phone number must contain at least one digit.');
      }
      return true;
    }),
  body('phoneNumbers.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('Phone isPrimary must be boolean.')
    .toBoolean(),
  body('emails')
    .optional()
    .isArray()
    .withMessage('Emails must be an array.'),
  body('emails.*.label')
    .optional()
    .isString()
    .withMessage('Email label must be a string.')
    .isLength({ max: 40 })
    .withMessage('Email label cannot exceed 40 characters.'),
  body('emails.*.email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Email must be valid.'),
  body('emails.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('Email isPrimary must be boolean.')
    .toBoolean(),
  body('company').optional().isString().withMessage('Company must be a string.'),
  body('address').optional().isString().withMessage('Address must be a string.'),
  body('tags').optional().isArray().withMessage('Tags must be an array.'),
  body('tags.*').optional().isString().withMessage('Each tag must be a string.'),
  body('avatar.url').optional({ checkFalsy: true }).isURL().withMessage('Avatar URL must be valid.'),
  body('avatar.publicId').optional().isString().withMessage('Avatar publicId must be a string.'),
  body('isFavorite').optional().isBoolean().withMessage('isFavorite must be boolean.').toBoolean(),
];

const listQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1 to 100.'),
  query('sort')
    .optional()
    .isIn([
      'name_asc',
      'name_desc',
      'company_asc',
      'recently_added',
      'recently_updated',
      'recently_viewed',
    ])
    .withMessage('Unsupported sort option.'),
  query('favorite').optional().isBoolean().withMessage('favorite must be boolean.').toBoolean(),
];

const searchQueryRules = [
  query('mode').optional().isIn(SEARCH_MODES).withMessage('Unsupported search mode.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1 to 100.'),
  query('favorite').optional().isBoolean().withMessage('favorite must be boolean.').toBoolean(),
];

const suggestionsQueryRules = [
  query('mode').optional().isIn(SEARCH_MODES).withMessage('Unsupported search mode.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1 to 50.'),
  query('favorite').optional().isBoolean().withMessage('favorite must be boolean.').toBoolean(),
];

const recentsQueryRules = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1 to 100.'),
  query('favorite').optional().isBoolean().withMessage('favorite must be boolean.').toBoolean(),
];

const favoriteRules = [
  body('isFavorite').optional().isBoolean().withMessage('isFavorite must be boolean.').toBoolean(),
];

module.exports = {
  handleValidation,
  objectIdParam,
  contactRules,
  listQueryRules,
  searchQueryRules,
  suggestionsQueryRules,
  recentsQueryRules,
  favoriteRules,
};
