# Contributing

This is a small, mostly educational project — keep changes simple and avoid introducing build tooling/frameworks unless there's a real need.

## Local development

See [README.md](README.md#local-development).

## Reporting a bug

[Open an issue](https://github.com/thekyria/hagioi/issues/new) describing what you expected, what happened instead, and how to reproduce it (page URL, language, browser/device, and the saint involved if it's a data error such as a wrong feast day or location). Screenshots help. For security issues, follow [SECURITY.md](SECURITY.md) instead — don't file them publicly.

## Before opening a PR

- Follow the conventions in [AGENTS.md](AGENTS.md) (ESM only, method guards + env var validation in API handlers, etc.).
- There's no test suite or linter configured — don't add one as part of an unrelated change.
- If you edited `public/data/saints.json`, run `npm run validate` before opening your PR.
- Optionally install [pre-commit](https://pre-commit.com) and run `pre-commit install` to get the secret-scanning and no-binary-files checks locally; CI runs them anyway. Only website images (`.png`, `.jpg`, `.webp`) under `public/assets/` may be binary.
- Keep commits focused; explain any non-obvious trade-offs in the PR description.

## Adding a saint

Add an entry to `public/data/saints.json` and, if you have one, an icon file under `public/assets/icons/`. Only use public-domain icons or ones with clear attribution to the iconographer.

- **Add the Greek translation too.** Add a matching entry (same `id`, same number/order of location labels) to `public/data/saints.el.json` — see [AGENTS.md](AGENTS.md#data-model). `npm run validate` fails if a saint is untranslated.

- **Check the saint isn't already there.** Search by `id`, by name (including alternate spellings/transliterations and with/without prefixes like "St."), and by feast day and location. Update the existing entry rather than adding a duplicate — `npm run validate` only catches duplicate `id`s.
- **Keep the file sorted.** Insert the entry in alphabetical order the same way the app sorts saints: by `name` ignoring leading titles/prefixes such as "St.", "Sts.", "Holy", "Apostle", "The" (see `NAME_TITLE_PREFIXES` / `getNameSortKey()` in `public/script.js`). For example, "Apostle Barnabas" goes under "B". If a new name introduces a new prefix, add it to `NAME_TITLE_PREFIXES` as well.
