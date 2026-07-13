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
