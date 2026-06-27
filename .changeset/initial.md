---
'@vskstudio/takt-mcp': minor
---

Initial release: MCP server exposing Takt analytics as agent tools (list_sites, get_summary, get_timeseries, get_breakdown, get_realtime, get_goals, get_funnels, get_revenue, list_event_properties, get_property_breakdown) plus a `takt://sites` resource, authenticated with a Takt API key against a self-hosted instance. Includes a resilient HTTP layer (per-request timeout, retry/backoff with Retry-After), opt-in stderr debug logging, and `--help`/`--version` flags.
