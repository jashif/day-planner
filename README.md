# Day (React + TypeScript)

A quiet, minimal day-to-day planner that syncs your tasks across devices.

Built with React 19, TypeScript, Vite, and Firebase (Auth + Firestore).

## Stack

- React function components + hooks (no classes)
- TypeScript throughout, `strict` mode
- Vite for dev/build
- Firebase Authentication (email/password + Google) for accounts
- Firestore for task storage, scoped per user at `users/{uid}/tasks`, with
  offline persistence via `persistentLocalCache`
- Installable PWA (`vite-plugin-pwa`) — add to home screen on phone/desktop,
  works offline via a generated service worker
- AI task breakdown ("Break it down") powered by Firebase AI Logic (Gemini
  Developer API, free tier) — splits a task into a checklist of smaller,
  actionable steps, called directly from the client via Firebase's proxy so
  no API key is ever exposed in app code

## Structure

```
src/
  types/task.ts          task, priority, view, and subtask types
  db/tasksDb.ts          Firestore read/write/subscribe layer
  ai/breakdownTask.ts    Gemini prompt + structured JSON output for step breakdown
  firebase/config.ts     Firebase app/auth/Firestore/AI Logic init
  firebase/AuthProvider.tsx  auth context (sign in/up, Google, sign out)
  hooks/useTasks.ts      per-user realtime task subscription + mutations
  utils/dates.ts         date formatting helpers
  components/
    AuthScreen.tsx        sign-in / sign-up screen
    Header.tsx            date heading + today's summary
    ProgressRing.tsx       animated completion ring
    Composer.tsx           add-task form
    Tabs.tsx               Today / Upcoming / All
    TaskList.tsx           grouping + sorting + empty state
    TaskRow.tsx            single task row + AI breakdown panel
    EmptyState.tsx         empty state copy + icon
  App.tsx
  main.tsx
  index.css
firestore.rules          security rules restricting each user to their own tasks
firebase.json            Firebase CLI config (for deploying firestore.rules)
```

## Run locally

```bash
npm install
cp .env.example .env   # fill in your Firebase project's web config
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

## Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Email/Password** and **Google** sign-in providers.
3. Enable **Firestore Database**.
4. Deploy `firestore.rules` (Firebase Console → Firestore → Rules, or
   `firebase deploy --only firestore:rules` with the Firebase CLI).
5. Copy the web app config into `.env` (see `.env.example`), and add the same
   `VITE_FIREBASE_*` variables to Netlify's site environment variables.
6. Add your Netlify domain to **Authentication → Settings → Authorized
   domains** so Google sign-in works in production.
7. Enable **Build → AI Logic** in the console, choose the **Gemini Developer
   API** as the backend (this is the free-tier option), and follow the
   guided setup. No extra env vars are needed — it reuses your existing
   Firebase web config.
8. (Recommended before wider use) Set up **Firebase App Check** on the AI
   Logic product to stop unauthorized clients from burning through your
   free-tier quota.


## Deploy — GitHub + Netlify

1. Push to a new GitHub repo:

   ```bash
   git init
   git add .
   git commit -m "Day planner (React + TS)"
   git branch -M main
   git remote add origin https://github.com/<you>/day-planner.git
   git push -u origin main
   ```

2. In Netlify: **Add new site → Import an existing project → GitHub**, pick
   the repo. `netlify.toml` already sets:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Don't forget to set the `VITE_FIREBASE_*` environment variables in
     Netlify's site settings.

3. Deploy. Every push to `main` redeploys automatically.
