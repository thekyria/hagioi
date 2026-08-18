# AGENTS.md

## Project overview

Hagioi is an interactive map of Orthodox Christian saints. It's a static frontend (vanilla HTML/CSS/JS) served alongside a couple of Vercel serverless functions. There is no build step, no bundler/framework, and no database — saint data is a static JSON file.

## Data model

- `public/data/saints.json` — array of saints. Each saint has `id`, `name`, `feastDay`, `title` (rank, e.g. Martyr/Hierarch/Venerable), `icon` (filename under `public/assets/icons/`), `bio` (short paragraph), and `locations` (array of `{ label, lat, lng }` — a saint can have multiple markers, e.g. birthplace and place of martyrdom).
- `public/assets/icons/` — one icon image per saint, filename referenced from `saints.json`. Only use public-domain icons or ones with clear attribution to the iconographer — this hasn't been vetted yet, treat as a risk before adding real content. If a saint's icon file is missing, the frontend falls back to `public/assets/avatar-placeholder.svg`.
- `script.js` fetches `saints.json` directly (no API round-trip needed since it's static content), flattens `locations` into map markers, and shows icon + bio in an `InfoWindow` on marker click.

## Runtime & conventions

- ESM syntax only (`import`/`export default`), no CommonJS.
- API handlers follow the Vercel Node function signature: `export default function/async function handler(req, res) { ... }`.
- Guard unsupported HTTP methods with `405 Method Not Allowed` before handling logic.
- Never log or expose secrets; validate required env vars exist before using them and return `500` if missing.
- `api/v1/config.js` returns the Google Maps API key to the client. Security relies on restricting that key to allowed HTTP referrers in Google Cloud Console, not on server-side auth — keep it that way unless there's a real reason to add auth back.

## Environment variables

Required (set locally in `.env.local`, never committed):
- `GOOGLE_MAPS_API_KEY` (must be HTTP-referrer restricted in Google Cloud Console)

## Working in this repo

- No test suite or linter is currently configured — don't invent one unless asked.
- Keep changes minimal; this is a small static site, avoid introducing build tooling/frameworks unless explicitly requested.
- This project has an educational purpose for its author — don't take prior design decisions for granted, call out trade-offs when relevant.
- When adding a new API route, mirror the existing handlers' style: method guard, env var validation.
