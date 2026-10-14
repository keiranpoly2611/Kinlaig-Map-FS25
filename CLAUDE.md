# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Interactive Farming Simulator 25 field planner for **Kinlaig** (modded map: 48 fields + 27 land parcels (75 markers; "Fields 1–48" / "Land 49–76" layer toggles)). One of 4 independent map repos plus a hub; see `ARCHITECTURE.md` in the hub repo (`FS25Interactive/FS25Interactive.github.io`) for the full cross-repo reference.

- Live: https://keiranpoly2611.github.io/Kinlaig-Map-FS25/
- Hub: https://fs25interactive.github.io/
- Cloud Sync map id: `kinlaig` (`CLOUD_MAP_ID` in `src/core/store.js`)

## Commands

```bash
npm install       # first time (CI uses npm ci)
npm run dev       # Vite dev server, http://localhost:5173/Kinlaig-Map-FS25/
npm run build     # production build to dist/
npm run preview   # serve dist/ locally
```

There is no test runner or linter configured. Verify changes by building and exercising the app in a browser (tabs, field editor, search, map modes, reload persistence).

## Deploy

Push to `main` -> `.github/workflows/deploy.yml` builds and publishes to GitHub Pages. `vite.config.js` sets `base: '/Kinlaig-Map-FS25/'`; it must match the repo name or every asset URL breaks in production.

## Architecture

Vite + Tailwind CSS v4 + DaisyUI v5, plain JavaScript (ES modules), no framework. Vertical-slice layout:

```
src/
  main.js                 # imports styles, calls each feature's init*()
  core/                   # shared: dom.js, field-data.js (markersData), store.js (state, local save, cloud room), plan-entries.js
  data/reference-tables.js
  features/
    app-shell/ cloud-sync/ field-editor/ guide/ map-modes/ map-view/ owners/ search/
  styles/main.css
public/kinlaig-map.webp   # the map image
index.html                # static sidebar/tab markup; behaviour is wired by the features
```

Known coupling: `map-view`, `search` import `map-modes`; `owners`, `search` import `app-shell`.

### Things that differ per map (everything else is identical across the 4 repos)

- `markersData` in `src/core/field-data.js` (coordinates digitised per map)
- the image in `public/`
- localStorage key prefix (`kinlaig_fs25_*`), `CLOUD_MAP_ID`, page title/heading/share link in `index.html`

When changing shared behaviour, apply the same change to all 4 map repos (they are copies of one template, not a shared package).

## Local save data

Plans, owners and map mode live in `localStorage`, namespaced per map code: `localSaveKey(base)` -> `base + '::' + (room || 'default')`. Cloud tab settings use `CLOUD_MAP_ID + '_fs25_'` keys. Do not rename existing keys without a migration (users would lose saves).

## Cloud Sync (Supabase)

Shared project `aicyvaqkzqlijffqihzd`, table `map_saves(map_id, room_code, access_code, data, ...)`. RLS has zero policies; access is only via `SECURITY DEFINER` RPCs: `fs25_load_map`, `fs25_save_map` (room must already exist), `fs25_create_room` (explicit creation, kept separate on purpose). The anon/publishable key in `src/features/cloud-sync/index.js` is public by design. UI says "Map code"; internals still say "room" - keep it that way.

## Do not

- Run `supabase db push` or change seed rows/default map codes against the live project without the owner asking; the owner's own login is in active use for data gathering.
- Write to the live Supabase project while testing (create/save); a bogus-code load is safe.
- Move this repo into a subpath of another repo; each map has its own Pages site.
