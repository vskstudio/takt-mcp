import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { TaktClient } from './client.js'
import type { Config } from './config.js'

// Exposes the organization's sites as a readable MCP resource, so an agent can
// pull site context (domains) without spending a tool call. Only registered when
// a default org is configured (the listing endpoint is org-scoped).
export function registerResources(server: McpServer, client: TaktClient, config: Config): void {
  if (!config.defaultOrg) return
  const org = config.defaultOrg

  server.registerResource(
    'sites',
    'takt://sites',
    {
      title: 'Takt sites',
      description: `Sites in the "${org}" organization reachable with the configured API key.`,
      mimeType: 'application/json',
    },
    async (uri) => {
      const sites = await client.get(`/orgs/${encodeURIComponent(org)}/sites`)
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(sites, null, 2) }],
      }
    },
  )
}
