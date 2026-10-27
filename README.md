# hagioi

**English** | [Ελληνικά](README.el.md) | [Italiano](README.it.md) | [Français](README.fr.md) | [Español](README.es.md) | [Deutsch](README.de.md)

An interactive map of Orthodox Christian saints. Click a marker to see the saint's icon, feast day, and a short biography. It can be installed as an app on phones and desktops ("Install" or "Add to Home Screen" in the browser).

Built as a static frontend (vanilla HTML/CSS/JS) with a couple of small Vercel serverless functions — no build step, no framework, no database. Saint data lives in [public/data/saints.json](public/data/saints.json). The site is available in English and Greek (language selector in the header); Greek saint translations live in [public/data/saints.el.json](public/data/saints.el.json).

## Local development

1. Copy [.env.local.example](.env.local.example) to `.env.local` and fill in `GOOGLE_MAPS_API_KEY` (restrict it to HTTP referrers in Google Cloud Console, including `http://localhost:3000/*` for local dev).
2. Install the Vercel CLI if you don't have it, then run:
   ```bash
   npx vercel dev
   ```
   Open the printed local URL (typically http://localhost:3000).

See [AGENTS.md](AGENTS.md) for more on the data model and conventions.

### Pre-commit hooks

Optional but recommended: install [pre-commit](https://pre-commit.com) and run `pre-commit install`. The hooks in [.pre-commit-config.yaml](.pre-commit-config.yaml) scan for secrets (gitleaks) and reject binary files other than website images under `public/assets/`. CI runs the same checks.

## Dependencies

There are no npm dependencies, so [package.json](package.json) lists none. What the site does use:

| Dependency | Used for | Version | Declared in |
| --- | --- | --- | --- |
| Google Maps JavaScript API | Runtime: the map | Google's current release (loaded from `maps.googleapis.com`) | [public/script.js](public/script.js) |
| [@googlemaps/markerclusterer](https://github.com/googlemaps/js-markerclusterer) | Runtime: marker clustering | 2.6.2 (vendored) | [public/vendor/markerclusterer.min.js](public/vendor/markerclusterer.min.js) header |
| Vercel Web Analytics | Runtime: page view counts | Served by Vercel (`/_vercel/insights/script.js`) | The entry pages (`public/index.html`, `public/en/`, `public/el/`) |
| Vercel Node.js runtime | Runtime: serverless functions in `api/` | Vercel default | Vercel project settings |
| Node.js | Dev/CI only: `npm run validate` | LTS | [.github/workflows/validate-data.yml](.github/workflows/validate-data.yml) |
| Vercel CLI | Dev only: `npx vercel dev` | Latest via `npx` | [README](#local-development) |
| pre-commit, gitleaks | Dev/CI only: secret and binary-file checks | gitleaks 8.28.0 | [.pre-commit-config.yaml](.pre-commit-config.yaml), [.github/workflows/](.github/workflows/) |

## Subprojects

None. Everything — site, serverless functions and saint data — lives in this one repository.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), including [how to report a bug](CONTRIBUTING.md#reporting-a-bug). For security issues, see [SECURITY.md](SECURITY.md) — please report them privately.

## Support

- [Buy Me a Coffee](https://buymeacoffee.com/thekyria)
- [Ko-fi](https://ko-fi.com/thekyria)
- [PayPal](https://paypal.me/TheodorosKyriakidis)
- [Patreon](https://www.patreon.com/c/thekyria)
