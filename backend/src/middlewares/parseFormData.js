const parseJsonField = (body, field) => {
  if (typeof body[field] !== 'string') {
    return;
  }

  try {
    body[field] = JSON.parse(body[field]);
  } catch (_error) {
    // Leave the original value in place so validation returns a clear error.
  }
};

const parseFormDataJson = (req, _res, next) => {
  if (!req.body) {
    return next();
  }

  ['phoneNumbers', 'emails', 'tags', 'avatar'].forEach((field) => parseJsonField(req.body, field));
  return next();
};

module.exports = parseFormDataJson;
