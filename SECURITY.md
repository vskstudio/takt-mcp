# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub's [security advisories](https://github.com/vskstudio/takt-mcp/security/advisories/new),
or email security@vskstudio.com. We aim to acknowledge within 72 hours and to ship
a fix or mitigation for confirmed issues as quickly as is practical.

When reporting, please include:

- a description of the issue and its impact,
- steps to reproduce (a minimal MCP request sequence is ideal),
- the `takt-mcp` version (`takt-mcp --version`) and your Node.js version.

## Scope and threat model

`takt-mcp` is a thin stdio client that forwards read-only requests to a Takt
instance using a single API key supplied via `TAKT_API_KEY`.

- The API key is read from the environment, sent only as a `Bearer` header to the
  configured `TAKT_BASE_URL`, and is **never** written to logs (including
  `TAKT_DEBUG` output).
- `TAKT_BASE_URL` is validated to be an `http(s)` URL before any request is made.
- User-supplied path segments (domains, org slugs) are URL-encoded so they cannot
  inject extra path components.
- All diagnostics go to stderr; stdout is reserved for the MCP transport.

The server performs only `GET` requests against the documented Takt public read
API. It does not write data, spawn subprocesses, or read files beyond its own
configuration environment variables.

## Supported versions

The latest published `0.x` release receives security fixes.
