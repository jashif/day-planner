# Day

A quiet, minimal day-to-day planner. Tasks live in your browser's IndexedDB — no
account, no server, nothing to lose on refresh. Built as plain ES modules, no
build step, so it deploys as-is.

## Run locally

Any static server works, since browsers block `type="module"` on `file://`.

```bash
npx serve .
# or
python3 -m http.server 5500
```

Then open the printed local URL.

## Deploy — GitHub + Netlify

1. Push this folder to a new GitHub repo:

   ```bash
   git init
   git add .
   git commit -m "Day planner"
   git branch -M main
   git remote add origin https://github.com/<you>/day-planner.git
   git push -u origin main
   ```

2. In Netlify: **Add new site → Import an existing project → GitHub**, pick
   the repo. Build settings are already read from `netlify.toml`:
   - Build command: *(none)*
   - Publish directory: `.`

3. Deploy. That's it — no environment variables, no build step.

Every push to `main` redeploys automatically.

## Roadmap: syncing to Postgres

The storage layer is isolated in `src/db.js`, so swapping it later is
contained. The plan:

- Keep IndexedDB as the offline-first source of truth.
- Add a `sync.js` module that pushes/pulls deltas to a small API in front of
  Postgres (a `tasks` table keyed by the same `id` used here, plus
  `updated_at` for conflict resolution).
- Queue local writes while offline and flush them when back online.
