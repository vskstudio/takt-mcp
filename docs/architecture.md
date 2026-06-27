# Architecture

`takt-mcp` is intentionally small: a typed MCP front end over a single
authenticated HTTP client. Everything is read-only.

## Modules

| Module             | Responsibility                                                                          |
| ------------------ | --------------------------------------------------------------------------------------- |
| `src/config.ts`    | Parse + validate environment into a `Config`. Fails fast with `ConfigError`.            |
| `src/logger.ts`    | stderr-only `Logger`. Debug is opt-in; the API key is never logged.                     |
| `src/http.ts`      | `fetchResilient` — per-attempt timeout, bounded retry/backoff, `Retry-After` handling.  |
| `src/client.ts`    | `TaktClient` — builds URLs, sends the Bearer token, normalises non-2xx to `TaktApiError`. |
| `src/tools.ts`     | The `ToolDef[]` catalogue: each tool's name, description, Zod input shape, and `run`.    |
| `src/resources.ts` | Registers the `takt://sites` MCP resource when an org is configured.                     |
| `src/server.ts`    | Wires tools + resources into an `McpServer`, mapping errors to MCP error results.        |
| `src/index.ts`     | CLI entry: `--help`/`--version`, loads config, connects the stdio transport. Public exports. |

## Request flow

```
tool handler ─▶ TaktClient.get(path, query)
                 │  build URL: baseUrl + /api/v1 + path + query
                 │  headers: Authorization: Bearer <key>, Accept: application/json
                 ▼
              fetchResilient(url, init, { timeoutMs, maxRetries, … })
                 │  per-attempt AbortController timeout
                 │  retry 429/5xx/network with backoff + jitter, honour Retry-After
                 ▼
              Response ─▶ ok?  ─ yes ─▶ JSON.parse(body)  ─▶ tool result
                                └─ no ──▶ throw TaktApiError(status, code, message)
```

## Design choices

- **stdout is the transport.** The MCP stdio protocol owns stdout, so the logger
  writes only to stderr. A stray `console.log` would corrupt the protocol stream.
- **Fail fast on config.** Bad config is an operator error; surfacing it at
  startup beats opaque runtime failures on the first tool call.
- **Dependency injection for testability.** `TaktClient` takes a `ClientDeps`
  ( `fetchImpl`, `logger`, `http` overrides ), and `fetchResilient` accepts
  injectable `sleep`/`backoffMs`, so retries and timeouts are tested without real
  timers or sockets.
- **No `any`.** `@typescript-eslint/no-explicit-any` is an error; tool args are
  validated by Zod shapes at the MCP boundary.
- **URL-encode user input.** Domains and org slugs are spliced into paths via
  `encodeURIComponent`, preventing path-segment injection.

## Testing

`vitest`, fully offline. `fetchImpl` and the `sleep`/`backoffMs` hooks are
injected so timeout, retry, `Retry-After`, and error-mapping paths run
deterministically. `test/tools.test.ts` pins the stable tool-name set so an
accidental rename or removal fails CI.
