export interface Config {
  /** Base URL of the Takt instance, e.g. https://taktlytics.com (no trailing slash). */
  baseUrl: string
  /** API key (Bearer) minted in the Takt dashboard. */
  apiKey: string
  /** Default org slug used by tools that need one (e.g. list_sites) when none is passed. */
  defaultOrg?: string
  /** Per-request timeout in milliseconds. */
  timeoutMs: number
  /** Max retry attempts on transient failures (429 / 5xx / network). */
  maxRetries: number
  /** Emit debug logs to stderr. */
  debug: boolean
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

/** Hosted Takt origin, used as the base URL when none is provided. */
export const DEFAULT_BASE_URL = 'https://taktlytics.com'
const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_MAX_RETRIES = 2

function intEnv(raw: string | undefined, fallback: number, name: string, min: number, max: number): number {
  if (raw === undefined || raw.trim() === '') return fallback
  const n = Number(raw)
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ConfigError(`${name} must be an integer in [${min}, ${max}], got "${raw}"`)
  }
  return n
}

function boolEnv(raw: string | undefined): boolean {
  const v = (raw ?? '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

// Reads configuration from the environment. TAKT_BASE_URL defaults to the hosted
// Takt origin (https://taktlytics.com) so the server works out of the box;
// self-hosted operators override it to point at their own instance.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const baseUrl = ((env.TAKT_BASE_URL ?? '').trim() || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const apiKey = (env.TAKT_API_KEY ?? '').trim()
  const defaultOrg = (env.TAKT_ORG ?? '').trim() || undefined

  let parsed: URL
  try {
    parsed = new URL(baseUrl)
  } catch {
    throw new ConfigError(`TAKT_BASE_URL is not a valid URL: "${baseUrl}"`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ConfigError('TAKT_BASE_URL must use http:// or https://')
  }
  if (!apiKey) {
    throw new ConfigError('TAKT_API_KEY is required (mint one in the Takt dashboard)')
  }

  return {
    baseUrl,
    apiKey,
    defaultOrg,
    timeoutMs: intEnv(env.TAKT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, 'TAKT_TIMEOUT_MS', 1_000, 120_000),
    maxRetries: intEnv(env.TAKT_MAX_RETRIES, DEFAULT_MAX_RETRIES, 'TAKT_MAX_RETRIES', 0, 10),
    debug: boolEnv(env.TAKT_DEBUG),
  }
}
