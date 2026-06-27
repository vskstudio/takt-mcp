export interface Config {
  /** Base URL of the Takt instance, e.g. https://takt.example.com (no trailing slash). */
  baseUrl: string
  /** API key (Bearer) minted in the Takt dashboard. */
  apiKey: string
  /** Default org slug used by tools that need one (e.g. list_sites) when none is passed. */
  defaultOrg?: string
}

class ConfigError extends Error {}

// Reads configuration from the environment. Takt is self-hosted, so there is no
// canonical default base URL — the operator must point the server at their own
// instance.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const baseUrl = (env.TAKT_BASE_URL ?? '').trim().replace(/\/+$/, '')
  const apiKey = (env.TAKT_API_KEY ?? '').trim()
  const defaultOrg = (env.TAKT_ORG ?? '').trim() || undefined

  if (!baseUrl) {
    throw new ConfigError('TAKT_BASE_URL is required (e.g. https://takt.example.com)')
  }
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new ConfigError('TAKT_BASE_URL must start with http:// or https://')
  }
  if (!apiKey) {
    throw new ConfigError('TAKT_API_KEY is required (mint one in the Takt dashboard)')
  }

  return { baseUrl, apiKey, defaultOrg }
}
