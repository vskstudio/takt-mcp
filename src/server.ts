import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { TaktApiError, TaktClient } from './client.js'
import type { Config } from './config.js'
import { createLogger } from './logger.js'
import { registerResources } from './resources.js'
import { tools } from './tools.js'
import { VERSION } from './version.js'

export function createServer(
  config: Config,
  client: TaktClient = new TaktClient(config, { logger: createLogger(config.debug) }),
): McpServer {
  const server = new McpServer({ name: 'takt-mcp', version: VERSION })

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.shape },
      async (args: Record<string, unknown>) => {
        try {
          const data = await tool.run(client, config, args)
          return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
        } catch (err) {
          const message =
            err instanceof TaktApiError
              ? `Takt API error (${err.status} ${err.code}): ${err.message}`
              : err instanceof Error
                ? err.message
                : String(err)
          return { isError: true, content: [{ type: 'text' as const, text: message }] }
        }
      },
    )
  }

  registerResources(server, client, config)

  return server
}
