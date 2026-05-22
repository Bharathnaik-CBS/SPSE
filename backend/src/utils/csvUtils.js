const { Readable } = require('stream');
const csvParser = require('csv-parser');
const { prepareContactPayload } = require('./duplicateUtils');

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  return ['true', '1', 'yes', 'y'].includes(String(value || '').trim().toLowerCase());
};

const splitList = (value) =>
  String(value || '')
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const parsePhoneNumbers = (row) => {
  if (row.phoneNumbers) {
    return String(row.phoneNumbers)
      .split('|')
      .map((item, index) => {
        const [label, number, primary] = item.split(':');
        return {
          label: label || (index === 0 ? 'Mobile' : 'Other'),
          number: number || label,
          isPrimary: parseBoolean(primary) || index === 0,
        };
      });
  }

  return [
    {
      label: row.phoneLabel || 'Mobile',
      number: row.phone || row.number || '',
      isPrimary: true,
    },
  ];
};

const parseEmails = (row) => {
  if (row.emails) {
    return String(row.emails)
      .split('|')
      .map((item, index) => {
        const [label, email, primary] = item.split(':');
        return {
          label: label || (index === 0 ? 'Personal' : 'Other'),
          email: email || label,
          isPrimary: parseBoolean(primary) || index === 0,
        };
      });
  }

  if (!row.email) {
    return [];
  }

  return [
    {
      label: row.emailLabel || 'Personal',
      email: row.email,
      isPrimary: true,
    },
  ];
};

const csvRowToContactPayload = (row) =>
  prepareContactPayload({
    name: row.name,
    phoneNumbers: parsePhoneNumbers(row),
    emails: parseEmails(row),
    company: row.company,
    address: row.address,
    tags: splitList(row.tags),
    isFavorite: parseBoolean(row.isFavorite),
    avatar: row.avatarUrl
      ? {
          url: row.avatarUrl,
          publicId: row.avatarPublicId || '',
        }
      : undefined,
  });

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = [];

    Readable.from(buffer)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('error', reject)
      .on('end', () => resolve(rows));
  });

const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const serializeContactsToCsv = (contacts = []) => {
  const headers = [
    'id',
    'name',
    'phoneNumbers',
    'emails',
    'company',
    'address',
    'tags',
    'isFavorite',
    'avatarUrl',
    'avatarPublicId',
    'lastViewedAt',
    'createdAt',
    'updatedAt',
  ];

  const rows = contacts.map((contact) => {
    const phoneNumbers = (contact.phoneNumbers || [])
      .map((phone) => `${phone.label}:${phone.number}:${phone.isPrimary}`)
      .join('|');
    const emails = (contact.emails || [])
      .map((email) => `${email.label}:${email.email}:${email.isPrimary}`)
      .join('|');

    return [
      contact._id?.toString() || contact.id,
      contact.name,
      phoneNumbers,
      emails,
      contact.company,
      contact.address,
      (contact.tags || []).join('|'),
      contact.isFavorite,
      contact.avatar?.url || '',
      contact.avatar?.publicId || '',
      contact.lastViewedAt ? new Date(contact.lastViewedAt).toISOString() : '',
      contact.createdAt ? new Date(contact.createdAt).toISOString() : '',
      contact.updatedAt ? new Date(contact.updatedAt).toISOString() : '',
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
};

module.exports = {
  parseCsvBuffer,
  csvRowToContactPayload,
  serializeContactsToCsv,
};
