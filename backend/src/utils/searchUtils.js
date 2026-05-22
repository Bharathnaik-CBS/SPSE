const { normalizePhoneNumber, normalizeTags } = require('./duplicateUtils');

const SEARCH_MODES = ['name_number', 'email', 'company'];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseTags = (tags) => {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return normalizeTags(tags);
  }

  return normalizeTags(String(tags).split(','));
};

const getPagination = (query, defaults = {}) => {
  const defaultPage = defaults.page || 1;
  const defaultLimit = defaults.limit || 20;
  const maxLimit = defaults.maxLimit || 100;

  const page = Math.max(Number.parseInt(query.page, 10) || defaultPage, 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildTagFilter = (tags) => {
  const parsedTags = parseTags(tags);
  if (parsedTags.length === 0) {
    return {};
  }

  return { tags: { $all: parsedTags } };
};

const getListSort = (sort = 'name_asc') => {
  const sorts = {
    name_asc: { name: 1, _id: 1 },
    name_desc: { name: -1, _id: 1 },
    company_asc: { company: 1, name: 1, _id: 1 },
    recently_added: { createdAt: -1, _id: 1 },
    recently_updated: { updatedAt: -1, _id: 1 },
    recently_viewed: { lastViewedAt: -1, name: 1, _id: 1 },
  };

  return sorts[sort] || sorts.name_asc;
};

const classifyNameNumberSearch = (q) => {
  const term = String(q || '').trim();
  const hasAlphabet = /[a-zA-Z]/.test(term);
  const digits = normalizePhoneNumber(term);

  if (hasAlphabet || !digits) {
    return {
      type: 'name',
      regex: new RegExp(escapeRegex(term), 'i'),
      sort: { name: 1, _id: 1 },
    };
  }

  if (digits.length === 2 || digits.length === 3) {
    return {
      type: 'phone_suffix',
      regex: new RegExp(`${escapeRegex(digits)}$`),
      sortValue: {
        type: 'phone',
        pattern: `${escapeRegex(digits)}$`,
      },
      sort: { 'phoneNumbers.normalizedNumber': 1, name: 1, _id: 1 },
    };
  }

  return {
    type: 'phone',
    regex: new RegExp(escapeRegex(digits)),
    sortValue: {
      type: 'phone',
      pattern: escapeRegex(digits),
    },
    sort: { 'phoneNumbers.normalizedNumber': 1, name: 1, _id: 1 },
  };
};

const buildFavoriteFilter = (favorite) => {
  if (favorite === undefined || favorite === null || favorite === '') {
    return {};
  }

  return { isFavorite: favorite === true || String(favorite).toLowerCase() === 'true' };
};

const buildSearchQuery = ({ q, mode = 'name_number', tags, favorite }) => {
  const trimmedQ = String(q || '').trim();
  const selectedMode = SEARCH_MODES.includes(mode) ? mode : 'name_number';
  const query = {
    ...buildTagFilter(tags),
    ...buildFavoriteFilter(favorite),
  };

  if (!trimmedQ) {
    return {
      query: null,
      sort: { name: 1, _id: 1 },
      mode: selectedMode,
      matchType: 'none',
    };
  }

  if (selectedMode === 'email') {
    query['emails.email'] = new RegExp(escapeRegex(trimmedQ.toLowerCase()), 'i');
    return {
      query,
      sort: { 'emails.email': 1, name: 1, _id: 1 },
      sortValue: {
        type: 'email',
        pattern: escapeRegex(trimmedQ.toLowerCase()),
      },
      mode: selectedMode,
      matchType: 'email',
    };
  }

  if (selectedMode === 'company') {
    query.company = new RegExp(escapeRegex(trimmedQ), 'i');
    return {
      query,
      sort: { company: 1, name: 1, _id: 1 },
      mode: selectedMode,
      matchType: 'company',
    };
  }

  const nameNumber = classifyNameNumberSearch(trimmedQ);
  if (nameNumber.type === 'name') {
    query.name = nameNumber.regex;
  } else {
    query['phoneNumbers.normalizedNumber'] = nameNumber.regex;
  }

  return {
    query,
    sort: nameNumber.sort,
    sortValue: nameNumber.sortValue,
    mode: selectedMode,
    matchType: nameNumber.type,
  };
};

const getMatchingSortStages = (sortValue) => {
  if (!sortValue) {
    return [];
  }

  if (sortValue.type === 'email') {
    return [
      {
        $addFields: {
          __matchedEmails: {
            $filter: {
              input: '$emails',
              as: 'emailItem',
              cond: {
                $regexMatch: {
                  input: '$$emailItem.email',
                  regex: sortValue.pattern,
                  options: 'i',
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          __sortValue: {
            $ifNull: [{ $arrayElemAt: ['$__matchedEmails.email', 0] }, ''],
          },
        },
      },
      { $sort: { __sortValue: 1, name: 1, _id: 1 } },
      { $project: { __matchedEmails: 0, __sortValue: 0 } },
    ];
  }

  if (sortValue.type === 'phone') {
    return [
      {
        $addFields: {
          __matchedPhones: {
            $filter: {
              input: '$phoneNumbers',
              as: 'phoneItem',
              cond: {
                $regexMatch: {
                  input: '$$phoneItem.normalizedNumber',
                  regex: sortValue.pattern,
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          __sortValue: {
            $ifNull: [{ $arrayElemAt: ['$__matchedPhones.normalizedNumber', 0] }, ''],
          },
        },
      },
      { $sort: { __sortValue: 1, name: 1, _id: 1 } },
      { $project: { __matchedPhones: 0, __sortValue: 0 } },
    ];
  }

  return [];
};

const pickPrimaryPhone = (contact) => {
  const phone = contact.phoneNumbers?.find((item) => item.isPrimary) || contact.phoneNumbers?.[0];
  return phone ? { label: phone.label, number: phone.number } : null;
};

const pickMatchingEmail = (contact, q) => {
  const emails = contact.emails || [];
  if (!q) {
    const primary = emails.find((item) => item.isPrimary) || emails[0];
    return primary ? { label: primary.label, email: primary.email } : null;
  }

  const lowered = String(q).toLowerCase();
  const match = emails.find((item) => item.email?.toLowerCase().includes(lowered));
  const fallback = emails.find((item) => item.isPrimary) || emails[0];
  const selected = match || fallback;

  return selected ? { label: selected.label, email: selected.email } : null;
};

const toSuggestion = (contact, context = {}) => ({
  id: contact._id?.toString() || contact.id,
  name: contact.name,
  primaryPhone: pickPrimaryPhone(contact),
  matchingEmail: context.mode === 'email' ? pickMatchingEmail(contact, context.q) : null,
  company: contact.company || '',
  tags: contact.tags || [],
  avatar: contact.avatar || null,
  matchType: context.matchType,
});

module.exports = {
  SEARCH_MODES,
  parseTags,
  getPagination,
  buildTagFilter,
  buildFavoriteFilter,
  getListSort,
  buildSearchQuery,
  getMatchingSortStages,
  toSuggestion,
};
