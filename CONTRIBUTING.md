# Contributing

This is a small, mostly educational project — keep changes simple and avoid introducing build tooling/frameworks unless there's a real need.

## Local development

See [README.md](README.md#local-development).

## Before opening a PR

- Follow the conventions in [AGENTS.md](AGENTS.md) (ESM only, method guards + env var validation in API handlers, etc.).
- There's no test suite or linter configured — don't add one as part of an unrelated change.
- Keep commits focused; explain any non-obvious trade-offs in the PR description.

## Adding a saint

Add an entry to `public/data/saints.json` and, if you have one, an icon file under `public/assets/icons/`. Only use public-domain icons or ones with clear attribution to the iconographer.
