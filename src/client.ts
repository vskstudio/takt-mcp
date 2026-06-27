import type { Config } from './config.js'
import { fetchResilient, type HttpOptions } from './http.js'
import { noopLogger, type Logger } from './logger.js'

export class TaktApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'TaktApiError'
  }
}

export type Query = Record<string, string | number | undefined>

export interface ClientDeps {
  fetchImpl?: typeof fetch
  logger?: Logger
  /** Overrides passed through to the resilient HTTP layer (tests inject sleep/backoff). */
  http?: Partial<HttpOptions>
}

// Thin authenticated client over the Takt public read API (/api/v1). All calls
// are GET; the API key is sent as a Bearer token. Transient failures are retried
// by the HTTP layer; non-2xx responses are normalised to TaktApiError so tool
// handlers can surface a clean message (including the 402 "API quota exceeded"
// case from the billing axis).
export class TaktClient {
  private readonly logger: Logger

  constructor(
    private readonly config: Config,
    private readonly deps: ClientDeps = {},
  ) {
    this.logger = deps.logger ?? noopLogger
  }

  async get<T>(path: string, query: Query = {}): Promise<T> {
    const url = new URL(`${this.config.baseUrl}/api/v1${path}`)
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
    }

    this.logger.debug('GET', { path, query })

    let res: Response
    try {
      res = await fetchResilient(
        url,
        { headers: { authorization: `Bearer ${this.config.apiKey}`, accept: 'application/json' } },
        {
          timeoutMs: this.config.timeoutMs,
          maxRetries: this.config.maxRetries,
          fetchImpl: this.deps.fetchImpl,
          logger: this.logger,
          ...this.deps.http,
        },
      )
    } catch (cause) {
      throw new TaktApiError(0, 'network_error', `cannot reach Takt at ${this.config.baseUrl}: ${String(cause)}`)
    }

    const text = await res.text()
    if (!res.ok) {
      let code = `http_${res.status}`
      let message = text || res.statusText
      try {
        const body = JSON.parse(text) as { code?: string; message?: string }
        if (body.code) code = body.code
        if (body.message) message = body.message
      } catch {
        // non-JSON error body: keep the raw text
      }
      this.logger.debug('error response', { status: res.status, code })
      throw new TaktApiError(res.status, code, message)
    }

    return (text ? JSON.parse(text) : null) as T
  }
}
