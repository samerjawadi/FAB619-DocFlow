# DocFlow

DocFlow is a Vite + React app.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Sync templates across devices (Firebase)

Templates are stored in browser local storage by default.
To make templates available on all devices, configure Firebase Firestore.

### 1) Add environment variables

Create or update `.env` with values from your Firebase Web app:

```bash
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

### 2) Create Firestore database and rules

In Firebase Console:

1. Create a project (or open your project).
2. Register a Web app and copy config values.
3. Open **Firestore Database** and create a database.
4. Add these rules to allow app access.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /templates/{templateId} {
      allow read, write: if true;
    }
  }
}
```

For production, replace public rules with Firebase Auth based rules.

### 3) Restart the app

```bash
npm run dev
```

When Firebase variables are set, templates are loaded from Firestore and saved there.
If Firebase is not configured or unavailable, the app falls back to local storage.

## Deploy to GitHub Pages

This repository includes a workflow at `.github/workflows/deploy.yml` that deploys the `dist` folder to GitHub Pages on every push to `main`.

### 1) Push this project to GitHub

Make sure your default branch is `main` and the workflow file is committed.

### 2) Enable Pages in repository settings

In GitHub:

1. Open **Settings** -> **Pages**.
2. Set **Source** to **GitHub Actions**.

### 3) Trigger deployment

Push to `main` (or run the workflow manually from the Actions tab).

After the workflow finishes, your site URL will be:

```text
https://<your-github-username>.github.io/<repo-name>/
```

## Notes

- The Vite `base` path is configured automatically for GitHub Pages builds.
- `404.html` is generated from `index.html` in the workflow to support SPA route refreshes.
