import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadConfig } from './config.js'
import { createServer } from './server.js'

export { createServer } from './server.js'
export { TaktClient, TaktApiError } from './client.js'
export { loadConfig, type Config } from './config.js'
export { tools } from './tools.js'

async function main() {
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
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`takt-mcp: fatal: ${err instanceof Error ? err.stack : String(err)}`)
    process.exit(1)
  })
}
