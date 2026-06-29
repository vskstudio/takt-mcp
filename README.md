# @vskstudio/takt-mcp

[![CI](https://github.com/vskstudio/takt-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/vskstudio/takt-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@vskstudio/takt-mcp.svg)](https://www.npmjs.com/package/@vskstudio/takt-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[Model Context Protocol](https://modelcontextprotocol.io) server for [Takt](https://github.com/vskstudio) — query your sites' privacy-friendly analytics from any MCP-aware AI agent (Claude Desktop, Claude Code, Cursor, …).

The server is a thin, **read-only** client over the Takt public API. It runs **on your machine** and talks to a Takt instance using **your** API key — by default the hosted origin `https://taktlytics.com`, or your own self-hosted instance via `TAKT_BASE_URL`.

```
┌─────────────┐   stdio (MCP)   ┌────────────┐   HTTPS + Bearer   ┌──────────────┐
│  AI agent   │ ───────────────▶│  takt-mcp  │ ──────────────────▶│ Takt instance│
│ (Claude, …) │ ◀────────────── │ (this pkg) │ ◀───── JSON ────── │  /api/v1     │
└─────────────┘                 └────────────┘                    └──────────────┘
```

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Tools](#tools)
- [Resources](#resources)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Documentation](#documentation)

## Requirements

- Node.js ≥ 18
- A Takt account on the hosted service (`https://taktlytics.com`), or a self-hosted Takt instance (set `TAKT_BASE_URL`)
- A Takt **API key** (Dashboard → Settings → API keys) with the permissions for the tools you want to use:
  - `stats:read` — every reporting tool (summary, timeseries, breakdown, realtime, goals, funnels, revenue, event properties, property breakdown)
  - `sites:read` — `list_sites`

> A Takt API key is **bound to a single site**. So `list_sites` returns just that one site, and the `domain` you pass to the other tools must be the key's own domain (any other domain returns "site not found"). To cover several sites, mint one key per site and run one server instance per key.

## Quick start

The server runs straight from npm with `npx` — nothing to install or build. Every
client below boils down to the same command, `npx -y @vskstudio/takt-mcp`, plus
your `TAKT_BASE_URL` / `TAKT_API_KEY` in the environment.

### Claude Code

One command, no file to edit (use `-s user` for a global install instead of the
current project):

```bash
claude mcp add takt \
  -e TAKT_BASE_URL=https://taktlytics.com \
  -e TAKT_API_KEY=takt_sk_… \
  -e TAKT_ORG=my-org \
  -- npx -y @vskstudio/takt-mcp
```

### Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "takt": {
      "command": "npx",
      "args": ["-y", "@vskstudio/takt-mcp"],
      "env": {
        "TAKT_BASE_URL": "https://taktlytics.com",
        "TAKT_API_KEY": "takt_sk_…",
        "TAKT_ORG": "my-org"
      }
    }
  }
}
```

### Codex CLI

Add a block to `~/.codex/config.toml`:

```toml
[mcp_servers.takt]
command = "npx"
args = ["-y", "@vskstudio/takt-mcp"]
env = { TAKT_BASE_URL = "https://taktlytics.com", TAKT_API_KEY = "takt_sk_…", TAKT_ORG = "my-org" }
```

### Cursor / Windsurf

Use the same `mcpServers` JSON as Claude Desktop, in `~/.cursor/mcp.json`
(Cursor) or `~/.codeium/windsurf/mcp_config.json` (Windsurf).

### VS Code (Copilot / Cline)

```bash
code --add-mcp '{"name":"takt","command":"npx","args":["-y","@vskstudio/takt-mcp"],"env":{"TAKT_BASE_URL":"https://taktlytics.com","TAKT_API_KEY":"takt_sk_…","TAKT_ORG":"my-org"}}'
```

Or commit a `.mcp.json` (Cline) / `.vscode/mcp.json` (Copilot, under a `"servers"`
key) with the same fields.

### Any other MCP client

The package ships a `takt-mcp` binary speaking MCP over stdio, so any client that
can launch a command works:

```bash
TAKT_BASE_URL=https://taktlytics.com TAKT_API_KEY=takt_sk_… npx -y @vskstudio/takt-mcp
```

Useful flags:

```bash
npx @vskstudio/takt-mcp --version   # print the version
npx @vskstudio/takt-mcp --help      # print usage and the full environment reference
```

## Configuration

The server is configured entirely through environment variables:

| Variable           | Required | Default | Description                                                                    |
| ------------------ | -------- | ------- | ------------------------------------------------------------------------------ |
| `TAKT_BASE_URL`    | no       | `https://taktlytics.com` | Base URL of the Takt instance. Defaults to the hosted origin; set it to point at a self-hosted instance. Must be `http(s)`. |
| `TAKT_API_KEY`     | yes      | —       | API key, sent as a `Bearer` token. Never logged.                               |
| `TAKT_ORG`         | no       | —       | Default organization slug for `list_sites` and the `takt://sites` resource.    |
| `TAKT_TIMEOUT_MS`  | no       | `15000` | Per-request timeout in ms (range `1000`–`120000`).                             |
| `TAKT_MAX_RETRIES` | no       | `2`     | Retries on transient failures — `429`/`5xx`/network (range `0`–`10`).         |
| `TAKT_DEBUG`       | no       | `false` | Set to `1`/`true` to log diagnostics to **stderr** (the API key is never logged). |

Invalid values fail fast at startup with a clear message on stderr.

## Tools

| Tool                     | Description                                                          | Permission   |
| ------------------------ | ------------------------------------------------------------------- | ------------ |
| `list_sites`             | List the sites (domains) in an organization.                        | `sites:read` |
| `get_summary`            | Top-line metrics: visitors, sessions, pageviews, bounce, duration.  | `stats:read` |
| `get_timeseries`         | Visitors/pageviews over time, bucketed by hour or day.              | `stats:read` |
| `get_breakdown`          | Top values of a dimension (pages, sources, countries, devices, …).  | `stats:read` |
| `get_realtime`           | Visitors active in the last 5 minutes.                              | `stats:read` |
| `get_goals`              | Conversions per goal.                                               | `stats:read` |
| `get_funnels`            | Step-by-step funnel reports.                                        | `stats:read` |
| `get_revenue`            | Revenue grouped by currency for a revenue event.                    | `stats:read` |
| `list_event_properties`  | List the custom property keys recorded for an event.                | `stats:read` |
| `get_property_breakdown` | Break down a custom property of an event by value.                  | `stats:read` |

Most tools accept a time filter:

- `period` — one of `day`, `7d`, `30d`, `month`, `6mo`, `12mo` (default `7d`),
- or an explicit `from`/`to` range (`YYYY-MM-DD`),
- plus an optional `tz` (IANA timezone, e.g. `Europe/Paris`).

`get_summary` and `get_timeseries` also accept `compareToPrevious` to return the previous period of equal length. `get_breakdown` accepts `dimension`, an optional `country` (ISO-3166 alpha-2), and `limit`.

See the [Tools reference](./docs/tools.md) for the full parameter list of each tool.

## Resources

When `TAKT_ORG` is set, the server exposes one MCP resource:

| URI            | Description                                                          |
| -------------- | ------------------------------------------------------------------- |
| `takt://sites` | The sites in your organization, as JSON — context without a tool call. |

## How it works

- **stdio transport.** stdout carries the MCP protocol; **all** diagnostics go to stderr.
- **Resilient HTTP.** Each request has a timeout (`TAKT_TIMEOUT_MS`) and retries transient `429`/`5xx`/network errors with exponential backoff and jitter, honouring `Retry-After`.
- **Clean errors.** Non-2xx responses are normalised to a `Takt API error (status code): message`, including the `402 quota_api_depasse` billing case.
- **Safe by construction.** The base URL is validated; org/domain inputs are URL-encoded so they can't inject path segments; the API key never appears in any output.

See [docs/architecture.md](./docs/architecture.md) for the module layout and design rationale.

## Troubleshooting

| Symptom                                    | Likely cause / fix                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `TAKT_BASE_URL is not a valid URL`         | If set, it must be a full URL — e.g. `https://taktlytics.com`. Leave it unset to use the hosted origin. |
| `TAKT_BASE_URL must use http:// or https://` | Include the scheme, e.g. `https://taktlytics.com`.                        |
| `Takt API error (401 …)`                   | The key is wrong or revoked.                                                   |
| `Takt API error (403 …)`                   | The key lacks the required permission (`stats:read` / `sites:read`).          |
| `site not found`                           | The `domain` is not the key's site — keys are single-site bound.              |
| `Takt API error (402 quota_api_depasse)`   | The API quota for your plan is exhausted.                                      |
| `request timed out after …ms`              | Raise `TAKT_TIMEOUT_MS`, or check connectivity to your instance.              |

Set `TAKT_DEBUG=1` to see each request (method, path, query) and retry decisions on stderr.

## Development

```bash
pnpm install
pnpm test         # vitest
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm build        # tsup → dist/
```

The full gate (what CI runs): `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Documentation

- [Tools reference](./docs/tools.md) — every tool and parameter
- [Configuration](./docs/configuration.md) — env vars and tuning
- [Architecture](./docs/architecture.md) — modules and design
- [Recipes](./docs/recipes.md) — example prompts and flows
- Project [wiki](https://github.com/vskstudio/takt-mcp/wiki)

## License

MIT © VSK Studio
