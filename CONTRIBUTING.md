# Contributing

This is a small, mostly educational project — keep changes simple and avoid introducing build tooling/frameworks unless there's a real need.

## Local development

See [README.md](README.md#local-development).

## Before opening a PR

- Follow the conventions in [AGENTS.md](AGENTS.md) (ESM only, method guards + env var validation in API handlers, etc.).
- There's no test suite or linter configured — don't add one as part of an unrelated change.
- If you edited `public/data/saints.json`, run `npm run validate` before opening your PR.
- Keep commits focused; explain any non-obvious trade-offs in the PR description.

## Adding a saint

Add an entry to `public/data/saints.json` and, if you have one, an icon file under `public/assets/icons/`. Only use public-domain icons or ones with clear attribution to the iconographer.

- **Check the saint isn't already there.** Search by `id`, by name (including alternate spellings/transliterations and with/without prefixes like "St."), and by feast day and location. Update the existing entry rather than adding a duplicate — `npm run validate` only catches duplicate `id`s.
- **Keep the file sorted.** Insert the entry in alphabetical order the same way the app sorts saints: by `name` ignoring leading titles/prefixes such as "St.", "Sts.", "Holy", "Apostle", "The" (see `NAME_TITLE_PREFIXES` / `getNameSortKey()` in `public/script.js`). For example, "Apostle Barnabas" goes under "B". If a new name introduces a new prefix, add it to `NAME_TITLE_PREFIXES` as well.
