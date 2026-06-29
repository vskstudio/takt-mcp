# Configuration

`takt-mcp` is configured entirely through environment variables, set by your MCP
client in the server's `env` block (or exported in your shell when running the
binary directly).

## Variables

| Variable           | Required | Default | Range / format            | Notes                                                        |
| ------------------ | -------- | ------- | ------------------------- | ------------------------------------------------------------ |
| `TAKT_BASE_URL`    | no       | `https://taktlytics.com` | `http(s)` URL | Defaults to the hosted Takt origin; set it to point at a self-hosted instance. Trailing slashes are stripped. Validated at startup. |
| `TAKT_API_KEY`     | yes      | —       | string                    | Sent as `Authorization: Bearer …`. Never logged.             |
| `TAKT_ORG`         | no       | —       | slug                      | Default org for `list_sites` and the `takt://sites` resource. |
| `TAKT_TIMEOUT_MS`  | no       | `15000` | integer `1000`–`120000`   | Per-request timeout in milliseconds.                         |
| `TAKT_MAX_RETRIES` | no       | `2`     | integer `0`–`10`          | Retries on `429`/`5xx`/network errors.                       |
| `TAKT_DEBUG`       | no       | `false` | `1`/`true`/`yes`/`on`     | Logs diagnostics to stderr.                                  |

Any out-of-range or non-integer numeric value makes startup fail with a clear
`ConfigError` message on stderr — the server never starts in a half-configured
state.

## Tuning resilience

The HTTP layer retries transient failures (`429`, `500`, `502`, `503`, `504`,
and network/timeout errors) up to `TAKT_MAX_RETRIES` times. Backoff is
exponential (`250ms · 2^attempt`, capped at 8s) with random jitter, and a
`Retry-After` response header takes precedence over the computed delay.

- A slow or distant instance: raise `TAKT_TIMEOUT_MS`.
- A flaky network: raise `TAKT_MAX_RETRIES`.
- Latency-sensitive interactive use where you'd rather fail fast: set
  `TAKT_MAX_RETRIES=0`.

## Multiple sites

API keys are single-site bound. To query several sites, run one server instance
per key:

```json
{
  "mcpServers": {
    "takt-blog": {
      "command": "npx",
      "args": ["-y", "@vskstudio/takt-mcp"],
      "env": { "TAKT_BASE_URL": "https://taktlytics.com", "TAKT_API_KEY": "takt_sk_blog_…" }
    },
    "takt-shop": {
      "command": "npx",
      "args": ["-y", "@vskstudio/takt-mcp"],
      "env": { "TAKT_BASE_URL": "https://taktlytics.com", "TAKT_API_KEY": "takt_sk_shop_…" }
    }
  }
}
```
