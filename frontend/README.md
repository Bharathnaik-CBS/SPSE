# Smart Phonebook Search Engine Frontend

React/Vite single-page frontend for the Smart Phonebook Search Engine backend. The interface is search-first: the main search bar drives recent contacts, live suggestions, and full contact details inside one shared area.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Axios
- Controlled contact forms
- react-easy-crop for DP cropping
- lucide-react icons

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default environment:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

The backend should be running at `http://localhost:5000`.

## UI Behavior

- The landing page is the phonebook search engine.
- There is no separate search button.
- Suggestions update live after one character with a debounce around 280ms.
- The search input never clears automatically.
- The plus icon stays fixed inside the search field.
- Empty search shows recent contacts from `/api/contacts/recents`.
- Typed search shows suggestions from `/api/contacts/suggestions`.
- Clicking a contact loads full details from `/api/contacts/:id` in the same panel.

## Search Mode Switcher

The Search Mode Switcher cycles in this order:

1. Name/Number
2. Email
3. Company
4. Name/Number

It maps directly to backend modes:

- `name_number`
- `email`
- `company`

## Tag Filter Chips

Tag Filter Chips are separate from the Search Mode Switcher. Multiple chips can be selected.

Built-in chips:

- All
- Family
- Work
- Friends
- College
- Client
- Emergency
- Favorite

Selected normal tags are sent as `tags=family,work`. The Favorite chip sends `favorite=true`.

## Contact Details

The shared panel shows:

- Avatar or initials
- Name
- All phone numbers
- All emails
- Company
- Address
- Tags
- Favorite status
- Last viewed time
- Call, WhatsApp, email, favorite, edit, and delete actions

## Add/Edit Contact

The plus icon opens a drawer:

- Empty search opens a blank contact.
- Search text with existing suggestions opens a blank contact.
- No suggestions and a full 10-digit number prefills the phone field.
- No suggestions and text prefills the name field.
- Partial numbers do not prefill the phone field.

The form supports:

- Required name
- Multiple phone numbers
- Multiple emails
- Company
- Address
- Tags
- Favorite toggle
- Optional avatar image crop

Duplicate phone errors returned by the backend are shown clearly as toasts and inline server errors.

## Image Crop Feature

DP upload is optional. The user picks an image, crops/zooms it manually, then applies the crop. The cropped image blob is only uploaded when the contact is saved. The UI never uploads while the crop is being moved.

If Cloudinary is not configured in the backend, avatar file upload will be rejected by the backend. The frontend still keeps the crop UI ready for environments where Cloudinary variables are configured.

## Draft Resume

Unfinished create-contact drafts are stored in `localStorage`, not in MongoDB.

When the app opens and a meaningful draft exists, a side popup appears:

- Click the X to discard it.
- Click the popup body to reopen the Add Contact drawer with the draft restored.

Drafts are cleared after a successful save.

## CSV Import/Export

The CSV modal supports:

- Import from `/api/contacts/import`
- Export from `/api/contacts/export`
- Imported count
- Skipped duplicate count
- Invalid row count and details

## Keyboard Shortcuts

- `Ctrl + K`: focus search
- `N`: open Add Contact drawer
- `Esc`: close drawer/modal/details
- `Arrow Up/Down`: move through visible suggestions
- `Enter`: open highlighted suggestion

## Backend Integration

All API calls are centralized:

- `src/services/api.js`
- `src/services/contactService.js`

The frontend expects the backend response format:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

Errors are normalized from:

```json
{
  "success": false,
  "message": "...",
  "errors": {}
}
```

No fake contacts are hardcoded. If the backend is unavailable, the UI displays the API error instead of random placeholder data.
