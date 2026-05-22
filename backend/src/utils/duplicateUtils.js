const Contact = require('../models/Contact');
const AppError = require('./AppError');

const normalizeWhitespace = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizePhoneNumber = (value) => {
  const raw = String(value || '').trim();
  const digits = raw.replace(/[^\d]/g, '');

  if (digits.startsWith('00')) {
    return digits.slice(2);
  }

  return digits;
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  return ['true', '1', 'yes', 'y'].includes(String(value || '').trim().toLowerCase());
};

const normalizeTags = (tags = []) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set();
  return tags
    .map((tag) => normalizeWhitespace(tag).toLowerCase())
    .filter((tag) => {
      if (!tag || seen.has(tag)) {
        return false;
      }
      seen.add(tag);
      return true;
    });
};

const ensureSinglePrimary = (items = []) => {
  let primaryFound = false;

  const normalized = items.map((item) => {
    const isPrimary = Boolean(item.isPrimary) && !primaryFound;
    if (isPrimary) {
      primaryFound = true;
    }
    return {
      ...item,
      isPrimary,
    };
  });

  if (normalized.length > 0 && !primaryFound) {
    normalized[0].isPrimary = true;
  }

  return normalized;
};

const prepareContactPayload = (payload = {}) => {
  const phoneNumbers = Array.isArray(payload.phoneNumbers)
    ? payload.phoneNumbers
        .map((phone) => {
          const number = normalizeWhitespace(phone.number);
          const normalizedNumber = normalizePhoneNumber(number);

          return {
            label: normalizeWhitespace(phone.label) || 'Mobile',
            number,
            normalizedNumber,
            isPrimary: parseBoolean(phone.isPrimary),
          };
        })
        .filter((phone) => phone.number || phone.normalizedNumber)
    : [];

  const emails = Array.isArray(payload.emails)
    ? payload.emails
        .map((emailItem) => ({
          label: normalizeWhitespace(emailItem.label) || 'Personal',
          email: normalizeEmail(emailItem.email),
          isPrimary: parseBoolean(emailItem.isPrimary),
        }))
        .filter((emailItem) => emailItem.email)
    : [];

  const prepared = {
    name: normalizeWhitespace(payload.name),
    phoneNumbers: ensureSinglePrimary(phoneNumbers),
    emails: ensureSinglePrimary(emails),
    company: normalizeWhitespace(payload.company),
    address: normalizeWhitespace(payload.address),
    tags: normalizeTags(payload.tags),
    isFavorite: parseBoolean(payload.isFavorite),
  };

  if (payload.avatar && typeof payload.avatar === 'object') {
    prepared.avatar = {
      url: normalizeWhitespace(payload.avatar.url),
      publicId: normalizeWhitespace(payload.avatar.publicId),
    };
  }

  return prepared;
};

const getDuplicateNumbersInPayload = (phoneNumbers = []) => {
  const seen = new Set();
  const duplicates = new Set();

  phoneNumbers.forEach((phone) => {
    if (!phone.normalizedNumber) {
      return;
    }

    if (seen.has(phone.normalizedNumber)) {
      duplicates.add(phone.number);
    }
    seen.add(phone.normalizedNumber);
  });

  return Array.from(duplicates);
};

const assertNoDuplicatePhoneNumbers = async (phoneNumbers = [], excludeContactId = null) => {
  const duplicatedInPayload = getDuplicateNumbersInPayload(phoneNumbers);
  if (duplicatedInPayload.length > 0) {
    throw new AppError('Duplicate phone numbers are not allowed in the same contact.', 409, {
      duplicatePhoneNumbers: duplicatedInPayload,
    });
  }

  const normalizedNumbers = phoneNumbers.map((phone) => phone.normalizedNumber).filter(Boolean);
  if (normalizedNumbers.length === 0) {
    return;
  }

  const query = {
    'phoneNumbers.normalizedNumber': { $in: normalizedNumbers },
  };

  if (excludeContactId) {
    query._id = { $ne: excludeContactId };
  }

  const existingContact = await Contact.findOne(query).lean();
  if (!existingContact) {
    return;
  }

  const existingNumbers = new Set(
    existingContact.phoneNumbers.map((phone) => phone.normalizedNumber).filter(Boolean)
  );

  const duplicates = phoneNumbers
    .filter((phone) => existingNumbers.has(phone.normalizedNumber))
    .map((phone) => phone.number);

  throw new AppError('Duplicate phone numbers already exist in another contact.', 409, {
    duplicatePhoneNumbers: duplicates,
    existingContactId: existingContact._id.toString(),
  });
};

module.exports = {
  normalizeWhitespace,
  normalizePhoneNumber,
  normalizeEmail,
  parseBoolean,
  normalizeTags,
  prepareContactPayload,
  assertNoDuplicatePhoneNumbers,
};
