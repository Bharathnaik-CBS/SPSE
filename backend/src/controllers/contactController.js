const streamifier = require('streamifier');
const Contact = require('../models/Contact');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const {
  prepareContactPayload,
  assertNoDuplicatePhoneNumbers,
} = require('../utils/duplicateUtils');
const {
  getPagination,
  buildTagFilter,
  buildFavoriteFilter,
  getListSort,
  buildSearchQuery,
  getMatchingSortStages,
  toSuggestion,
} = require('../utils/searchUtils');
const {
  parseCsvBuffer,
  csvRowToContactPayload,
  serializeContactsToCsv,
} = require('../utils/csvUtils');
const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');

const uploadAvatarFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      return resolve(null);
    }

    if (!hasCloudinaryConfig()) {
      return reject(
        new AppError(
          'Avatar file upload requires Cloudinary environment variables. You may also send avatar.url directly.',
          503
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'smart-phonebook/avatars',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new AppError('Avatar upload failed.', 502, error.message));
        }

        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId || !hasCloudinaryConfig()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn(`Failed to delete old avatar ${publicId}: ${error.message}`);
  }
};

const buildListFilter = (queryParams) => {
  const filter = {
    ...buildTagFilter(queryParams.tags),
  };

  if (queryParams.favorite !== undefined) {
    filter.isFavorite = queryParams.favorite === 'true' || queryParams.favorite === true;
  }

  return filter;
};

const serializeLeanContact = (contact) => {
  if (!contact) {
    return contact;
  }

  const serialized = {
    ...contact,
    id: contact._id?.toString() || contact.id,
  };
  delete serialized._id;
  return serialized;
};

const fetchSearchResults = async ({ search, skip = 0, limit }) => {
  const matchingSortStages = getMatchingSortStages(search.sortValue);

  if (matchingSortStages.length === 0) {
    return Contact.find(search.query)
      .sort(search.sort)
      .collation({ locale: 'en', strength: 2 })
      .skip(skip)
      .limit(limit);
  }

  const contacts = await Contact.aggregate([
    { $match: search.query },
    ...matchingSortStages,
    { $skip: skip },
    { $limit: limit },
  ]).collation({ locale: 'en', strength: 2 });

  return contacts.map(serializeLeanContact);
};

const createContact = asyncHandler(async (req, res) => {
  const payload = prepareContactPayload(req.body);
  const uploadedAvatar = await uploadAvatarFile(req.file);

  if (uploadedAvatar) {
    payload.avatar = uploadedAvatar;
  }

  await assertNoDuplicatePhoneNumbers(payload.phoneNumbers);

  const contact = await Contact.create(payload);
  return sendSuccess(res, 201, 'Contact created successfully.', contact);
});

const getContacts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 20, maxLimit: 100 });
  const filter = buildListFilter(req.query);
  const sort = getListSort(req.query.sort);

  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort(sort).collation({ locale: 'en', strength: 2 }).skip(skip).limit(limit),
    Contact.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Contacts fetched successfully.', contacts, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    sort: req.query.sort || 'name_asc',
  });
});

const getContactById = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { $set: { lastViewedAt: new Date() } },
    { new: true, runValidators: true }
  );

  if (!contact) {
    throw new AppError('Contact not found.', 404);
  }

  return sendSuccess(res, 200, 'Contact fetched successfully.', contact);
});

const updateContact = asyncHandler(async (req, res) => {
  const existingContact = await Contact.findById(req.params.id);

  if (!existingContact) {
    throw new AppError('Contact not found.', 404);
  }

  const payload = prepareContactPayload(req.body);
  if (req.body.isFavorite === undefined) {
    delete payload.isFavorite;
  }

  const uploadedAvatar = await uploadAvatarFile(req.file);
  if (uploadedAvatar) {
    payload.avatar = uploadedAvatar;
  }

  await assertNoDuplicatePhoneNumbers(payload.phoneNumbers, req.params.id);

  const updatedContact = await Contact.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (uploadedAvatar && existingContact.avatar?.publicId) {
    await deleteCloudinaryAsset(existingContact.avatar.publicId);
  }

  return sendSuccess(res, 200, 'Contact updated successfully.', updatedContact);
});

const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);

  if (!contact) {
    throw new AppError('Contact not found.', 404);
  }

  if (contact.avatar?.publicId) {
    await deleteCloudinaryAsset(contact.avatar.publicId);
  }

  return sendSuccess(res, 200, 'Contact deleted successfully.', {
    id: req.params.id,
  });
});

const updateFavorite = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    throw new AppError('Contact not found.', 404);
  }

  contact.isFavorite =
    req.body.isFavorite === undefined ? !contact.isFavorite : Boolean(req.body.isFavorite);
  await contact.save();

  return sendSuccess(res, 200, 'Favorite status updated successfully.', contact);
});

const searchContacts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 20, maxLimit: 100 });
  const search = buildSearchQuery(req.query);

  if (!search.query) {
    return sendSuccess(res, 200, 'Search completed successfully.', [], {
      page,
      limit,
      total: 0,
      totalPages: 0,
      mode: search.mode,
      matchType: search.matchType,
    });
  }

  const [contacts, total] = await Promise.all([
    fetchSearchResults({ search, skip, limit }),
    Contact.countDocuments(search.query),
  ]);

  return sendSuccess(res, 200, 'Search completed successfully.', contacts, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    mode: search.mode,
    matchType: search.matchType,
  });
});

const getSuggestions = asyncHandler(async (req, res) => {
  const { limit } = getPagination(req.query, { limit: 5, maxLimit: 50 });
  const search = buildSearchQuery(req.query);

  if (!search.query) {
    return sendSuccess(res, 200, 'Suggestions fetched successfully.', [], {
      limit,
      mode: search.mode,
      matchType: search.matchType,
    });
  }

  const contacts = await fetchSearchResults({ search, skip: 0, limit });

  const suggestions = contacts.map((contact) =>
    toSuggestion(contact, {
      q: req.query.q,
      mode: search.mode,
      matchType: search.matchType,
    })
  );

  return sendSuccess(res, 200, 'Suggestions fetched successfully.', suggestions, {
    limit,
    mode: search.mode,
    matchType: search.matchType,
  });
});

const getRecents = asyncHandler(async (req, res) => {
  const { limit } = getPagination(req.query, { limit: 5, maxLimit: 100 });
  const filter = {
    lastViewedAt: { $ne: null },
    ...buildTagFilter(req.query.tags),
    ...buildFavoriteFilter(req.query.favorite),
  };

  const contacts = await Contact.find(filter)
    .sort({ lastViewedAt: -1, name: 1, _id: 1 })
    .limit(limit);

  return sendSuccess(res, 200, 'Recent contacts fetched successfully.', contacts, {
    limit,
    sort: 'lastViewedAt_desc',
  });
});

const importContacts = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('CSV file is required using the "file" form field.', 400);
  }

  const rows = await parseCsvBuffer(req.file.buffer);
  let importedCount = 0;
  let skippedDuplicateCount = 0;
  let invalidRowsCount = 0;
  const invalidRows = [];

  for (const [index, row] of rows.entries()) {
    try {
      const payload = csvRowToContactPayload(row);
      const contact = new Contact(payload);
      await contact.validate();
      await assertNoDuplicatePhoneNumbers(payload.phoneNumbers);
      await contact.save();
      importedCount += 1;
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 409) {
        skippedDuplicateCount += 1;
      } else if (error.code === 11000) {
        skippedDuplicateCount += 1;
      } else {
        invalidRowsCount += 1;
        invalidRows.push({
          rowNumber: index + 2,
          reason: error.message,
        });
      }
    }
  }

  return sendSuccess(res, 200, 'CSV import completed.', {
    importedCount,
    skippedDuplicateCount,
    invalidRowsCount,
    invalidRows,
  });
});

const exportContacts = asyncHandler(async (_req, res) => {
  const contacts = await Contact.find({}).sort({ name: 1, _id: 1 }).lean();
  const csv = serializeContactsToCsv(contacts);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="smart-phonebook-contacts.csv"');
  return res.status(200).send(csv);
});

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  updateFavorite,
  searchContacts,
  getSuggestions,
  getRecents,
  importContacts,
  exportContacts,
};
