# Adhkār — Dua Collection (Vite + React)

A personal mobile-first web app for collecting duas (Islamic supplications) with Arabic text, translation, and reward. Built with Vite, React, TypeScript, Tailwind CSS, and Firebase.

## Features

- Three-page navigation: collections → duas in a collection → single dua detail
- Cloud sync via Firestore with anonymous auth (private to your account)
- Offline-first: works without network, syncs when back online
- Real URLs for every page (works with browser back/forward, deep links, refresh)
- Mobile-optimised UI matching the reference Quran-words aesthetic
- Falls back to localStorage if Firebase isn't configured

## Project structure

```
src/
├── main.tsx              # entry point
├── App.tsx               # router + auth bootstrap
├── index.css             # Tailwind + base styles
├── types.ts              # Card, Subcard, SyncState
├── vite-env.d.ts         # Vite env type definitions
├── lib/
│   ├── firebase.ts       # Firebase init + anon auth
│   └── store.ts          # Firestore + localStorage data layer
├── hooks/
│   ├── useAuth.ts        # auth lifecycle hook
│   └── useCards.ts       # cards subscription + mutations
├── components/
│   ├── BrandBar.tsx      # top header
│   ├── BootScreen.tsx    # splash on load
│   ├── SyncStatus.tsx    # "Syncing…" / "Synced" pill
│   ├── Modal.tsx         # bottom-sheet modal
│   ├── ConfirmDialog.tsx # delete confirmation
│   ├── CardModal.tsx     # create/edit collection
│   ├── SubcardModal.tsx  # create/edit dua
│   ├── CollectionCard.tsx
│   ├── SubcardRow.tsx
│   ├── StatCard.tsx      # home page stat tiles
│   └── Icons.tsx         # SVG icons
└── pages/
    ├── HomePage.tsx
    ├── DetailPage.tsx
    └── SubDetailPage.tsx
```

## Prerequisites

- **Node.js 18+** ([download](https://nodejs.org))
- A Firebase project (instructions below)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

Follow these steps in the [Firebase Console](https://console.firebase.google.com):

1. **Create a project** — click "Add project", give it a name, skip Google Analytics.
2. **Add a web app** — click the `</>` icon on the project home page, register an app, copy the `firebaseConfig` values.
3. **Enable anonymous auth** — go to Authentication (in the sidebar), click "Get started", then **Sign-in method → Anonymous → Enable**.
4. **Create Firestore database** — go to Firestore Database, click "Create database", choose a location near you, start in **production mode**.
5. **Deploy security rules** — paste the contents of `firestore.rules` (in this repo) into the **Rules** tab in Firestore, click Publish.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in the Firebase config values from step 2 above.

### 4. Run the dev server

```bash
npm run dev
```

Opens at `http://localhost:5173`. Hot reload is on — edits to any file appear instantly.

### 5. Build for production

```bash
npm run build
```

Output goes to `dist/`. Preview locally:

```bash
npm run preview
```

## Deployment

### Firebase Hosting (recommended)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

When prompted:
- Use existing project → select your project
- Public directory → `dist`
- Configure as single-page app → **Yes** (this is important — ensures React Router works)
- Set up automatic builds with GitHub → No

Then deploy:

```bash
npm run build
firebase deploy --only hosting
```

You'll get a URL like `https://your-project.web.app`. Or use `npm run deploy` (defined in `package.json`) to build and deploy in one step.

### Other hosts (Netlify, Vercel, Cloudflare Pages)

Build command: `npm run build`. Publish directory: `dist`.

For all of these, you must:
1. Add the deployed URL to **Firebase Console → Authentication → Settings → Authorized domains**.
2. Configure SPA fallback (so `/card/abc` doesn't 404) — most modern hosts handle this automatically for single-page apps, but check each host's docs.

## Tech stack notes

- **No state management library** (Redux, Zustand, etc.) — built-in React state plus a custom `useCards` hook is enough for this app's complexity.
- **React Router v6** for navigation — uses real URLs (`/card/abc/dua/xyz`).
- **Firestore offline persistence** is enabled, so the app works on flaky connections and queues writes for later.
- **localStorage mirror** of cloud data, so the app loads instantly with cached data while it syncs in the background.
- **CSS via Tailwind** with custom design tokens in `tailwind.config.js`. The mint green / forest green / gold palette is defined there.

## Customising

- **Colors** — edit `tailwind.config.js` (the `theme.extend.colors` block).
- **Fonts** — edit the `<link>` in `index.html` and the `fontFamily` block in `tailwind.config.js`.
- **Adding fields to a dua** — update the `Subcard` interface in `src/types.ts`, then add the field to `SubcardModal.tsx` and the renderer in `SubDetailPage.tsx`.

## Troubleshooting

**"Running in offline mode" warning shows up.**
You haven't filled in `.env.local`, or one of the values is missing. The app needs at least `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`.

**"Sync error" appears on every load.**
Open the browser's DevTools console. Most common causes:
- Anonymous auth not enabled in Firebase Console.
- Firestore rules not published, or the rules don't match what's in `firestore.rules` (which checks `request.auth.uid == userId`).
- The deployed URL isn't in Authorized Domains (only relevant for non-Firebase hosts).

**`/card/abc` shows a 404 after deploying.**
SPA fallback isn't configured. On Firebase Hosting, this is fixed by answering "Yes" when `firebase init hosting` asks "Configure as a single-page app". On Netlify, add a `_redirects` file with `/* /index.html 200`. On Vercel, add a `vercel.json` with appropriate rewrites.

**Hot reload isn't working.**
Make sure you're running `npm run dev` (not opening the file directly). Vite's HMR only works through the dev server.

## License

Personal use. Modify freely.
