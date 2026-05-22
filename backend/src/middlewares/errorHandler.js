const mongoose = require('mongoose');
const multer = require('multer');
const { sendError } = require('../utils/response');
const AppError = require('../utils/AppError');

const notFound = (req, res) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.errors);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return sendError(res, 422, 'Validation failed.', err.errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, 400, 'Invalid resource identifier.');
  }

  if (err instanceof multer.MulterError) {
    return sendError(res, 400, err.message);
  }

  if (err.code === 11000) {
    return sendError(res, 409, 'Duplicate value already exists.', err.keyValue);
  }

  console.error(err);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message || 'Internal server error.';

  return sendError(res, 500, message);
};

module.exports = {
  notFound,
  errorHandler,
};
