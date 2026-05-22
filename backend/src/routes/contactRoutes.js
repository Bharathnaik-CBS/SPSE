const express = require('express');
const contactController = require('../controllers/contactController');
const { avatarUpload, csvUpload } = require('../middlewares/upload');
const parseFormDataJson = require('../middlewares/parseFormData');
const {
  handleValidation,
  objectIdParam,
  contactRules,
  listQueryRules,
  searchQueryRules,
  suggestionsQueryRules,
  recentsQueryRules,
  favoriteRules,
} = require('../middlewares/validate');

const router = express.Router();

router.get('/search', searchQueryRules, handleValidation, contactController.searchContacts);
router.get(
  '/suggestions',
  suggestionsQueryRules,
  handleValidation,
  contactController.getSuggestions
);
router.get('/recents', recentsQueryRules, handleValidation, contactController.getRecents);
router.get('/export', contactController.exportContacts);
router.post('/import', csvUpload.single('file'), contactController.importContacts);

router
  .route('/')
  .post(
    avatarUpload.single('avatar'),
    parseFormDataJson,
    contactRules,
    handleValidation,
    contactController.createContact
  )
  .get(listQueryRules, handleValidation, contactController.getContacts);

router.patch(
  '/:id/favorite',
  objectIdParam('id'),
  favoriteRules,
  handleValidation,
  contactController.updateFavorite
);

router
  .route('/:id')
  .get(objectIdParam('id'), handleValidation, contactController.getContactById)
  .put(
    objectIdParam('id'),
    avatarUpload.single('avatar'),
    parseFormDataJson,
    contactRules,
    handleValidation,
    contactController.updateContact
  )
  .delete(objectIdParam('id'), handleValidation, contactController.deleteContact);

module.exports = router;
