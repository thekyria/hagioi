# Security Policy

Hagioi is a small static site with no user accounts, authentication, or stored user data. The only server-side logic is a serverless endpoint that hands the client a Google Maps API key restricted by HTTP referrer — that key is not a secret.

## Supported versions

The site deploys continuously from `main`; there are no numbered releases. Only the current `main` branch (the live site) gets security fixes.

## Reporting a vulnerability

Please **don't** open a public issue. Report it privately through [GitHub Security Advisories](https://github.com/thekyria/hagioi/security/advisories/new) (e.g. a way to bypass the referrer restriction, or something exposing an env var). Include steps to reproduce and the impact you expect. You should get a reply within a couple of weeks; this is a one-person hobby project, so please be patient.

## Security measures

- Secrets stay out of the repository: `.env*` files are git-ignored, and [gitleaks](https://github.com/gitleaks/gitleaks) scans every push, pull request and (weekly) the full history in CI, plus locally as a pre-commit hook.
- CI rejects tracked binary files other than the website's images under `public/assets/`.
- Third-party browser code is vendored at a fixed version (`public/vendor/`) rather than loaded from a CDN.
