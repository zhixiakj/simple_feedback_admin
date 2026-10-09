# simple_feedback_admin

Admin console for user feedback submitted by the [simple_feedback](../simple_feedback) Flutter package. Reads the Firestore `feedback` collection with support for viewing, filtering, searching, triage, deletion, and image previews.

Tech stack: Next.js (App Router) + React + Tailwind CSS + firebase-admin. The Admin SDK bypasses the client-side write-only security rules, so the console can read and update feedback documents.

## Features

- 🔐 Password login (`ADMIN_PASSWORD`); a proxy middleware guards every page and API route
- 📊 Stats overview: total, today's new, pending, and counts by type
- 🔍 Filters (type / platform / status) + keyword search across content, email, user ID, device ID, and source
- 📋 Paginated list with a detail drawer
- 🖼️ Image previews: supports both the embedded-Blob mode and the Cloud Storage path mode, click to zoom
- ✅ Mark resolved / reopen (writes `status` / `resolvedAt`, independent of the Flutter side)
- 🗑️ Delete feedback (with confirmation)

## Setup

### 1. Add the Firebase service account key

Firebase Console → Project settings → Service accounts → "Generate new private key", then save the downloaded JSON as `firebase-adminsdk.json` in the project root.

The file is already gitignored. Alternatively, set the `FIREBASE_SERVICE_ACCOUNT` environment variable to the JSON string directly (recommended when deploying to Vercel or similar platforms).

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

- `ADMIN_PASSWORD`: password to log into the console
- `AUTH_SECRET`: key for signing the session cookie, generate with `openssl rand -hex 32`

### 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and log in with your password.

## Notes

- **List and stats scan the most recent 1000 documents.** To support keyword substring search (not natively supported by Firestore) and avoid composite indexes, the server fetches the most recent 1000 docs (projected without the heavy `imgs` field) and filters/aggregates in memory. The UI shows this scope.
- **Images load on demand.** Images in the detail drawer are fetched one by one via `/api/feedback/[id]/image?index=n` and are never sent along with the list.
- **Storage mode.** If the Flutter side is configured with `FeedbackImageStorage.storage` (`imgs` stores paths), the bucket is derived as `<project_id>.appspot.com` by default; set `FIREBASE_STORAGE_BUCKET` if you use a non-default bucket.
- **Status fields are admin-only.** `status` (open/resolved) and `resolvedAt` are written exclusively by this console; the client-side security rules of the Flutter app cannot read them, so the two sides never interfere.

## Deployment (optional)

Taking Vercel as an example:

1. Set the environment variables `ADMIN_PASSWORD`, `AUTH_SECRET`, and `FIREBASE_SERVICE_ACCOUNT` (the full service account JSON as a string);
2. If you need Storage image previews, also set `FIREBASE_STORAGE_BUCKET`.

Cookies automatically get the `secure` flag in production, so the site must be served over HTTPS.
