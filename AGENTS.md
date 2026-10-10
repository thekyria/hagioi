# AGENTS.md

## Project overview

Hagioi is an interactive map of Orthodox Christian saints. It's a static frontend (vanilla HTML/CSS/JS) served alongside a couple of Vercel serverless functions. There is no build step, no bundler/framework, and no database — saint data is a static JSON file.

## Data model

- `public/data/saints.json` — array of saints. Each saint has `id`, `name`, `feastDay`, `title` (rank, e.g. Martyr/Hierarch/Venerable), `icon` (filename under `public/assets/icons/`), `bio` (short paragraph), and `locations` (array of `{ label, lat, lng }` — a saint can have multiple markers, e.g. birthplace and place of martyrdom).
- `public/assets/icons/` — one icon image per saint, filename referenced from `saints.json`. Only use public-domain icons or ones with clear attribution to the iconographer — this hasn't been vetted yet, treat as a risk before adding real content. If a saint's icon file is missing, the frontend falls back to `public/assets/avatar-placeholder.svg`.
- When adding saints to `saints.json`:
  - **Check they don't already exist.** Search for the saint by `id`, by name (including alternate spellings/transliterations, e.g. "Acacius"/"Akakios", "Barbara"/"Varvara", with or without a leading "St."/"Holy"), and by feast day + location before adding. If an entry already exists, update it instead of adding a duplicate. `npm run validate` only catches duplicate `id`s, not the same saint under a different id or spelling.
  - **Insert in sorted order.** The array is kept alphabetical in the same order the app displays it: by `name` with any leading title/prefix stripped (see `NAME_TITLE_PREFIXES` and `getNameSortKey()` in `public/script.js`), compared with `localeCompare`. E.g. "Apostle Barnabas" sorts under "Barnabas" and "The Ten Martyrs of Crete" under "Crete". If you add a new kind of prefix to a `name`, add it to `NAME_TITLE_PREFIXES` too so the app and the file stay consistent.
- `public/data/saints.el.json` — Greek translations of the saint data: an object keyed by saint `id`, each with `name`, `title`, `bio` and `locations` (array of translated labels, same order/length as the saint's `locations`; coordinates are not duplicated). Fixed feast dates are formatted by the app, so `feastDay` is only present for movable feasts (e.g. "Third Sunday of Pascha"). **Every saint added or edited in `saints.json` must get a matching entry here**; `npm run validate` fails if any saint is missing or the location count differs. Greek names must start with one of the prefixes in `GREEK_NAME_TITLE_PREFIXES` (`public/script.js`), used for alphabetical sorting in Greek.
- `script.js` fetches `saints.json` directly (no API round-trip needed since it's static content), flattens `locations` into map markers, and shows icon + bio in an `InfoWindow` on marker click.

## Localization

- The site is available in English (default) and Greek. `public/i18n.js` (loaded before `script.js`) holds all UI strings (`STRINGS.en` / `STRINGS.el`), month/weekday names, language detection and the `t(key, params)` helper. Never hard-code user-facing text in `script.js`; add a key to both languages instead.
- Static markup in `index.html` is translated through `data-i18n="key"` (text) and `data-i18n-attr="attr:key;attr2:key2"` (attributes). `public/en/index.html` and `public/el/index.html` provide language-specific initial metadata for crawlers.
- Language is chosen by `?lang=en|el` in the URL, then by a `/en/` or `/el/` page path, then the saved choice (`localStorage` `hagioi.lang`), then the browser language. Header flags link to the language-specific pages, so switching reloads Google Maps with `language=<lang>` (the Maps language can only be set when its script loads).
- To add a language: add it to `SUPPORTED_LANGUAGES`, `LOCALE_DATA` and `STRINGS` in `i18n.js`, add `public/data/saints.<lang>.json`, a name-prefix list in `NAME_TITLE_PREFIXES_BY_LANGUAGE`, a localized page under `public/<lang>/`, a flag link in the header, and `hreflang` alternates in the entry pages and `sitemap.xml`.

## Runtime & conventions

- ESM syntax only (`import`/`export default`), no CommonJS.
- API handlers follow the Vercel Node function signature: `export default function/async function handler(req, res) { ... }`.
- Guard unsupported HTTP methods with `405 Method Not Allowed` before handling logic.
- Never log or expose secrets; validate required env vars exist before using them and return `500` if missing.
- `api/v1/config.js` returns the Google Maps API key to the client. Security relies on restricting that key to allowed HTTP referrers in Google Cloud Console, not on server-side auth — keep it that way unless there's a real reason to add auth back.
- `api/v1/version.js` returns the deployed git commit as the app version (shown in the footer). The site deploys continuously, so there are no numbered releases; the short commit SHA links to the exact source. It reads Vercel's system env vars (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV`, `VERCEL_GIT_PROVIDER`, `VERCEL_GIT_REPO_OWNER`, `VERCEL_GIT_REPO_SLUG`), which are optional — when missing (e.g. local dev) it returns nulls and the footer hides the version.

## Environment variables

Required (set locally in `.env.local`, never committed):
- `GOOGLE_MAPS_API_KEY` (must be HTTP-referrer restricted in Google Cloud Console)

## Working in this repo

- No general-purpose test suite or linter is currently configured — don't invent one unless asked. A dedicated data validator exists at `scripts/validate-saints.mjs`; keep `npm run validate` passing when editing `public/data/saints.json`.
- Keep changes minimal; this is a small static site, avoid introducing build tooling/frameworks unless explicitly requested.
- This project has an educational purpose for its author — don't take prior design decisions for granted, call out trade-offs when relevant.
- When adding a new API route, mirror the existing handlers' style: method guard, env var validation.
