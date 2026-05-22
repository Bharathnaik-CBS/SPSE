# Smart Phonebook Search Engine Backend

Production-style REST API backend for an assessment project named **Smart Phonebook Search Engine**. It manages contacts, multiple phone numbers, emails, tags, favorites, recent views, deterministic search, CSV import/export, optional avatar upload, and dashboard statistics.

The API contract is intentionally stable so a frontend can integrate without depending on internal implementation details.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- express-validator
- Multer
- Optional Cloudinary image upload
- CSV import/export
- Helmet, CORS, dotenv

## Project Structure

```text
backend/
  src/
    config/
      cloudinary.js
      db.js
    controllers/
      contactController.js
      dashboardController.js
    middlewares/
      errorHandler.js
      parseFormData.js
      upload.js
      validate.js
    models/
      Contact.js
    routes/
      contactRoutes.js
      dashboardRoutes.js
    utils/
      AppError.js
      asyncHandler.js
      csvUtils.js
      duplicateUtils.js
      response.js
      searchUtils.js
    app.js
    server.js
  .env.example
  package.json
  README.md
```

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create an environment file:

```bash
cp .env.example .env
```

3. Set `MONGODB_URI` in `.env`.

4. Start the API:

```bash
npm run dev
```

The API defaults to `http://localhost:5000`.

## Environment Variables

```text
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_phonebook
CORS_ORIGIN=http://localhost:3000

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Cloudinary is optional. If Cloudinary variables are not set, send avatar metadata directly as `avatar.url` and `avatar.publicId`. Do not send base64 image data.

## Standard Response Shape

Success:

```json
{
  "success": true,
  "message": "Contact created successfully.",
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

Paginated responses include a `meta` object.

## Contact Model

```json
{
  "id": "6650f5f2e2f0f8a404cc1001",
  "name": "Asha Patel",
  "phoneNumbers": [
    {
      "label": "Mobile",
      "number": "+91 98765 43210",
      "normalizedNumber": "919876543210",
      "isPrimary": true
    }
  ],
  "emails": [
    {
      "label": "Work",
      "email": "asha@example.com",
      "isPrimary": true
    }
  ],
  "company": "Acme Labs",
  "address": "Mumbai",
  "tags": ["client", "priority"],
  "avatar": {
    "url": "https://example.com/avatar.jpg",
    "publicId": "smart-phonebook/avatars/sample"
  },
  "isFavorite": false,
  "lastViewedAt": null,
  "createdAt": "2026-05-22T10:00:00.000Z",
  "updatedAt": "2026-05-22T10:00:00.000Z"
}
```

## Duplicate Phone Number Handling

Phone numbers are normalized by removing non-digit characters and converting `00` international prefixes where reasonable. The original display value is still stored.

Duplicate normalized phone numbers are rejected:

- Inside the same contact payload.
- Across all contacts.
- During updates, excluding the contact being updated.
- During CSV import, duplicate rows are skipped and counted.

MongoDB also has a unique index on `phoneNumbers.normalizedNumber` as a final consistency guard.

## API Endpoints

### Health

`GET /health`

### Create Contact

`POST /api/contacts`

JSON body:

```json
{
  "name": "Asha Patel",
  "phoneNumbers": [
    {
      "label": "Mobile",
      "number": "+91 98765 43210",
      "isPrimary": true
    }
  ],
  "emails": [
    {
      "label": "Work",
      "email": "asha@example.com",
      "isPrimary": true
    }
  ],
  "company": "Acme Labs",
  "address": "Mumbai",
  "tags": ["client", "priority"],
  "isFavorite": false
}
```

Multipart form-data is also supported for avatar upload:

- `avatar`: image file
- `phoneNumbers`, `emails`, `tags`, `avatar`: JSON strings

### List Contacts

`GET /api/contacts?page=1&limit=20&sort=name_asc&tags=client,priority&favorite=true`

Supported `sort` values:

- `name_asc`
- `name_desc`
- `company_asc`
- `recently_added`
- `recently_updated`
- `recently_viewed`

Tag filtering uses all selected tags. For example, `tags=client,priority` returns contacts that contain both tags.

### Get Contact

`GET /api/contacts/:id`

Returns full contact details and updates `lastViewedAt`.

### Update Contact

`PUT /api/contacts/:id`

Uses the same validation rules as create. Duplicate phone checks exclude the current contact.

### Delete Contact

`DELETE /api/contacts/:id`

### Favorite

`PATCH /api/contacts/:id/favorite`

Set explicitly:

```json
{
  "isFavorite": true
}
```

If `isFavorite` is omitted, the endpoint toggles the current value.

## Search

### Main Search

`GET /api/contacts/search?q=asha&mode=name_number&page=1&limit=20&tags=client&favorite=true`

Modes:

- `name_number`
- `email`
- `company`

Rules for `mode=name_number`:

- If `q` contains alphabets or mixed text, search by contact name.
- If `q` contains only numbers and length is 2 or 3, search phone numbers ending with that sequence.
- If `q` contains only numbers and length is greater than 3, search phone numbers by sequence.

Rules for other modes:

- `email`: searches inside all email values.
- `company`: searches company names.

Blank `q` returns an empty result set. The API does not return random suggestions.

Sorting:

- Name search: `name` ascending.
- Phone search: normalized phone number ascending.
- Email search: matching email field ascending.
- Company search: company ascending.

### Suggestions

`GET /api/contacts/suggestions?q=98&mode=name_number&limit=5&tags=client&favorite=true`

Suggestion response item:

```json
{
  "id": "6650f5f2e2f0f8a404cc1001",
  "name": "Asha Patel",
  "primaryPhone": {
    "label": "Mobile",
    "number": "+91 98765 43210"
  },
  "matchingEmail": null,
  "company": "Acme Labs",
  "tags": ["client"],
  "avatar": null,
  "matchType": "phone_suffix"
}
```

`matchingEmail` is populated for `mode=email`.

### Recents

`GET /api/contacts/recents?limit=5&tags=client,priority&favorite=true`

Returns contacts where `lastViewedAt` is not null, sorted by `lastViewedAt` descending, then name and id for deterministic ordering.

## CSV Import

`POST /api/contacts/import`

Use multipart form-data:

- `file`: CSV file

Supported columns:

```text
name,phone,phoneLabel,email,emailLabel,phoneNumbers,emails,company,address,tags,isFavorite,avatarUrl,avatarPublicId
```

Simple phone/email columns:

```csv
name,phone,phoneLabel,email,emailLabel,company,tags
Asha Patel,+91 98765 43210,Mobile,asha@example.com,Work,Acme Labs,client|priority
```

Multiple values:

```csv
name,phoneNumbers,emails,tags
Asha Patel,Mobile:+91 98765 43210:true|Work:022123456:false,Work:asha@example.com:true,client|priority
```

Import response:

```json
{
  "success": true,
  "message": "CSV import completed.",
  "data": {
    "importedCount": 10,
    "skippedDuplicateCount": 2,
    "invalidRowsCount": 1,
    "invalidRows": [
      {
        "rowNumber": 4,
        "reason": "Contact validation failed: name: Path `name` is required."
      }
    ]
  }
}
```

## CSV Export

`GET /api/contacts/export`

Returns a CSV file named `smart-phonebook-contacts.csv`.

## Dashboard

`GET /api/dashboard/stats`

Response data:

```json
{
  "totalContacts": 120,
  "favoriteContacts": 18,
  "companiesCount": 32,
  "recentlyAddedContacts": 9,
  "mostUsedTags": [
    {
      "tag": "client",
      "count": 22
    }
  ],
  "possibleDuplicateWarnings": [
    {
      "type": "same_name",
      "name": "Asha Patel",
      "count": 2,
      "contactIds": ["6650f5f2e2f0f8a404cc1001"]
    }
  ]
}
```

Phone-number duplicates are blocked, so duplicate warnings currently focus on same-name contacts.

## Frontend Integration Notes

- Use `/api/contacts/search` for committed search result pages.
- Use `/api/contacts/suggestions` for live autocomplete.
- Use `/api/contacts/recents` for recently viewed widgets.
- Keep selected tags as a comma-separated `tags` query parameter.
- Use stable `success`, `message`, `data`, and optional `meta` response keys.
- Do not send base64 avatars. Upload an image file through multipart form-data or store an external `avatar.url`.
- Treat `normalizedNumber` as backend metadata. Display `phoneNumbers[].number` to users.

## Validation Summary

- `name` is required and trimmed.
- At least one phone number is required.
- Phone numbers must contain at least one digit after normalization.
- Emails are optional, but if provided they must be valid.
- Tags are trimmed, lowercased, and deduplicated.
- Only one primary phone and one primary email are kept. If none is marked primary, the first item becomes primary.
- Pagination limits are capped to avoid unbounded queries.
