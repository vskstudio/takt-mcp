// Minimal stderr logger. stdout is reserved for the MCP stdio transport, so all
// diagnostics MUST go to stderr. Debug output is opt-in (TAKT_DEBUG) and never
// includes the API key.
export interface Logger {
  debug(message: string, fields?: Record<string, unknown>): void
  warn(message: string, fields?: Record<string, unknown>): void
}

function format(level: string, message: string, fields?: Record<string, unknown>): string {
  const suffix = fields && Object.keys(fields).length ? ' ' + JSON.stringify(fields) : ''
  return `takt-mcp ${level}: ${message}${suffix}`
}

export function createLogger(debug: boolean): Logger {
  return {
    debug(message, fields) {
      if (debug) process.stderr.write(format('debug', message, fields) + '\n')
    },
    warn(message, fields) {
      process.stderr.write(format('warn', message, fields) + '\n')
    },
  }
}

export const noopLogger: Logger = { debug() {}, warn() {} }
