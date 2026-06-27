# @vskstudio/takt-mcp

## 0.2.4

### Patch Changes

- Fix the CLI entrypoint so the server actually starts when launched through a
  `node_modules/.bin` symlink (npx, global install, every MCP client config): the
  guard now resolves `realpath` instead of comparing the raw symlink path, which
  never matched and left the process exiting silently. Keep `VERSION` in sync with
  `package.json` and add a CLI regression test. Expand the README with per-client
  install instructions (Claude Code, Claude Desktop, Codex, Cursor, Windsurf,
  VS Code). Versions 0.2.1–0.2.3 are deprecated (broken or no binary).

## 0.2.1

### Patch Changes

- 3c84e15: Release the HTTP response body before retrying a transient failure so the connection returns to the pool. Drop the redundant build from the `release` script (`prepublishOnly` already builds).

## 0.2.0

### Minor Changes

- 2b380f5: Initial release: MCP server exposing Takt analytics as agent tools (list_sites, get_summary, get_timeseries, get_breakdown, get_realtime, get_goals, get_funnels, get_revenue, list_event_properties, get_property_breakdown) plus a `takt://sites` resource, authenticated with a Takt API key against a self-hosted instance. Includes a resilient HTTP layer (per-request timeout, retry/backoff with Retry-After), opt-in stderr debug logging, and `--help`/`--version` flags.
