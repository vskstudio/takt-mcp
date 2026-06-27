import { pathToFileURL } from 'node:url'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadConfig } from './config.js'
import { createServer } from './server.js'

export { createServer } from './server.js'
export { TaktClient, TaktApiError, type ClientDeps, type Query } from './client.js'
export { loadConfig, ConfigError, type Config } from './config.js'
export { fetchResilient, HttpError, type HttpOptions } from './http.js'
export { createLogger, noopLogger, type Logger } from './logger.js'
export { tools, type ToolDef } from './tools.js'
export { VERSION } from './version.js'

import { VERSION } from './version.js'

const HELP = `takt-mcp ${VERSION} — Model Context Protocol server for Takt analytics

Usage:
  takt-mcp                Run the MCP server over stdio (default)
  takt-mcp --version      Print the version and exit
  takt-mcp --help         Print this help and exit

Environment:
  TAKT_BASE_URL    (required) Base URL of the Takt instance, e.g. https://takt.example.com
  TAKT_API_KEY     (required) API key minted in the Takt dashboard (single-site scoped)
  TAKT_ORG         (optional) Default org slug for list_sites and the sites resource
  TAKT_TIMEOUT_MS  (optional) Per-request timeout in ms (default 15000, range 1000-120000)
  TAKT_MAX_RETRIES (optional) Retries on transient failures (default 2, range 0-10)
  TAKT_DEBUG       (optional) Set to 1/true to log diagnostics to stderr
`

async function main() {
  const argv = process.argv.slice(2)
  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(`${VERSION}\n`)
    return
  }
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(HELP)
    return
  }

  let config
  try {
    config = loadConfig()
  } catch (err) {
    // Config errors must go to stderr — stdout is the MCP transport channel.
    console.error(`takt-mcp: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  const server = createServer(config)
  await server.connect(new StdioServerTransport())
}

// Only auto-start when run as the CLI entrypoint, so the module stays importable
// (and testable) without spawning a stdio server.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`takt-mcp: fatal: ${err instanceof Error ? err.stack : String(err)}`)
    process.exit(1)
  })
}
