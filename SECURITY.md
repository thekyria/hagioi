# Security Policy

Hagioi is a small static site with no user accounts, authentication, or stored user data. The only server-side logic is a serverless endpoint that hands the client a Google Maps API key restricted by HTTP referrer — that key is not a secret.

If you believe you've found a security issue anyway (e.g. a way to bypass the referrer restriction, or something exposing an env var), please open a GitHub issue or contact the maintainer directly rather than disclosing exploit details publicly.
