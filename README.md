# hagioi

An interactive map of Orthodox Christian saints. Click a marker to see the saint's icon, feast day, and a short biography.

Built as a static frontend (vanilla HTML/CSS/JS) with a couple of small Vercel serverless functions — no build step, no framework, no database. Saint data lives in [public/data/saints.json](public/data/saints.json).

## Local development

1. Copy [.env.local.example](.env.local.example) to `.env.local` and fill in `GOOGLE_MAPS_API_KEY` (restrict it to HTTP referrers in Google Cloud Console, including `http://localhost:3000/*` for local dev).
2. Install the Vercel CLI if you don't have it, then run:
   ```bash
   npx vercel dev
   ```
   Open the printed local URL (typically http://localhost:3000).

See [AGENTS.md](AGENTS.md) for more on the data model and conventions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). For security concerns, see [SECURITY.md](SECURITY.md).
