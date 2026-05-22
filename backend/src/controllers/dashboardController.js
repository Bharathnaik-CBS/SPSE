const Contact = require('../models/Contact');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getDashboardStats = asyncHandler(async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalContacts,
    favoriteContacts,
    companies,
    recentlyAddedContacts,
    mostUsedTags,
    duplicateNameWarnings,
  ] = await Promise.all([
    Contact.countDocuments({}),
    Contact.countDocuments({ isFavorite: true }),
    Contact.distinct('company', { company: { $nin: ['', null] } }),
    Contact.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Contact.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]),
    Contact.aggregate([
      {
        $group: {
          _id: { $toLower: '$name' },
          name: { $first: '$name' },
          count: { $sum: 1 },
          contactIds: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1, name: 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          type: 'same_name',
          name: 1,
          count: 1,
          contactIds: {
            $map: {
              input: '$contactIds',
              as: 'contactId',
              in: { $toString: '$$contactId' },
            },
          },
        },
      },
    ]),
  ]);

  return sendSuccess(res, 200, 'Dashboard stats fetched successfully.', {
    totalContacts,
    favoriteContacts,
    companiesCount: companies.length,
    recentlyAddedContacts,
    mostUsedTags,
    possibleDuplicateWarnings: duplicateNameWarnings,
  });
});

module.exports = {
  getDashboardStats,
};
