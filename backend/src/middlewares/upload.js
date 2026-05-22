const multer = require('multer');
const AppError = require('../utils/AppError');

const storage = multer.memoryStorage();

const imageFileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new AppError('Only image uploads are allowed.', 400));
  }

  return cb(null, true);
};

const csvFileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv'];
  const hasCsvName = file.originalname.toLowerCase().endsWith('.csv');

  if (!allowedMimeTypes.includes(file.mimetype) && !hasCsvName) {
    return cb(new AppError('Only CSV file uploads are allowed.', 400));
  }

  return cb(null, true);
};

const avatarUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

const csvUpload = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  avatarUpload,
  csvUpload,
};
