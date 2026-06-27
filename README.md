# @vskstudio/takt-mcp

[Model Context Protocol](https://modelcontextprotocol.io) server for [Takt](https://github.com/vskstudio) — query your sites' privacy-friendly analytics from any MCP-aware AI agent (Claude Desktop, Claude Code, Cursor, …).

The server is a thin, read-only client over the Takt public API. It runs **on your machine** and talks to **your** Takt instance using **your** API key — no analytics data is exposed publicly, and nothing is hosted by us.

## Requirements

- Node.js ≥ 18
- A self-hosted Takt instance
- A Takt **API key** (Dashboard → Settings → API keys) with the permissions for the tools you want to use:
  - `stats:read` — every reporting tool (summary, timeseries, breakdown, realtime, goals, funnels, revenue)
  - `sites:read` — `list_sites`

A Takt API key is **bound to a single site**. So `list_sites` returns just that one site, and the `domain` you pass to the other tools must be the key's own domain (any other domain returns "site not found"). To cover several sites, mint one key per site and run one server instance per key.

## Configuration

The server is configured entirely through environment variables:

| Variable         | Required | Description                                                        |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `TAKT_BASE_URL`  | yes      | Base URL of your Takt instance, e.g. `https://takt.example.com`.   |
| `TAKT_API_KEY`   | yes      | API key (sent as a Bearer token).                                  |
| `TAKT_ORG`       | no       | Default organization slug for `list_sites` when none is provided.  |

## Usage

### Claude Desktop / Claude Code

Add it to your MCP config (`claude_desktop_config.json`, or `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "takt": {
      "command": "npx",
      "args": ["-y", "@vskstudio/takt-mcp"],
      "env": {
        "TAKT_BASE_URL": "https://takt.example.com",
        "TAKT_API_KEY": "takt_sk_…",
        "TAKT_ORG": "my-org"
      }
    }
  }
}
```

### Any MCP client

The package ships a `takt-mcp` binary speaking MCP over stdio:

```bash
TAKT_BASE_URL=https://takt.example.com TAKT_API_KEY=takt_sk_… npx @vskstudio/takt-mcp
```

## Tools

| Tool             | Description                                                        | Permission     |
| ---------------- | ----------------------------------------------------------------- | -------------- |
| `list_sites`     | List the sites (domains) in an organization.                      | `sites:read`   |
| `get_summary`    | Top-line metrics: visitors, sessions, pageviews, bounce, duration.| `stats:read`   |
| `get_timeseries` | Visitors/pageviews over time, bucketed by hour or day.            | `stats:read`   |
| `get_breakdown`  | Top values of a dimension (pages, sources, countries, devices…).  | `stats:read`   |
| `get_realtime`   | Visitors active in the last 5 minutes.                            | `stats:read`   |
| `get_goals`      | Conversions per goal.                                             | `stats:read`   |
| `get_funnels`    | Step-by-step funnel reports.                                      | `stats:read`   |
| `get_revenue`    | Revenue grouped by currency for a revenue event.                  | `stats:read`   |

Most tools accept a time filter: `period` (`day`, `7d`, `30d`, `month`, `6mo`, `12mo`), or an explicit `from`/`to` range (`YYYY-MM-DD`), plus an optional `tz` (IANA timezone). `get_summary` and `get_timeseries` also accept `compareToPrevious` to return the previous period.

## Development

```bash
pnpm install
pnpm test         # vitest
pnpm typecheck
pnpm lint
pnpm build        # tsup → dist/
```

## License

MIT © VSK Studio
