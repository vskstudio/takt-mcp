import { noopLogger, type Logger } from './logger.js'

export interface HttpOptions {
  timeoutMs: number
  maxRetries: number
  fetchImpl?: typeof fetch
  logger?: Logger
  /** Injectable for tests; defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>
  /** Injectable for tests; defaults to a small randomized backoff. */
  backoffMs?: (attempt: number) => number
}

// HTTP statuses worth retrying: rate limiting + transient upstream failures.
const RETRYABLE = new Set([429, 500, 502, 503, 504])

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const defaultBackoff = (attempt: number) => {
  const base = Math.min(8_000, 250 * 2 ** attempt)
  return base + Math.floor(Math.random() * 250) // jitter to avoid thundering herd
}

// Parse a Retry-After header (delta-seconds or HTTP-date) into milliseconds.
function retryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined
  const secs = Number(header)
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000)
  const date = Date.parse(header)
  if (Number.isFinite(date)) return Math.max(0, date - Date.now())
  return undefined
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    readonly retryable: boolean,
  ) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
  }
}

// Performs a fetch with a per-attempt timeout and bounded retry/backoff on
// transient failures. Returns the final Response (callers inspect res.ok); only
// network/timeout errors and exhausted retries throw.
export async function fetchResilient(url: URL, init: RequestInit, opts: HttpOptions): Promise<Response> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const logger = opts.logger ?? noopLogger
  const sleep = opts.sleep ?? defaultSleep
  const backoff = opts.backoffMs ?? defaultBackoff

  let lastErr: unknown
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs)
    try {
      const res = await fetchImpl(url, { ...init, signal: controller.signal })
      if (RETRYABLE.has(res.status) && attempt < opts.maxRetries) {
        const wait = retryAfterMs(res.headers.get('retry-after')) ?? backoff(attempt)
        logger.debug('retrying after transient status', { status: res.status, attempt, waitMs: wait })
        await sleep(wait)
        continue
      }
      return res
    } catch (err) {
      lastErr = err
      const aborted = err instanceof Error && err.name === 'AbortError'
      if (attempt < opts.maxRetries) {
        const wait = backoff(attempt)
        logger.debug('retrying after network error', { aborted, attempt, waitMs: wait })
        await sleep(wait)
        continue
      }
      logger.warn('giving up after exhausting retries', { aborted, attempts: attempt + 1 })
      throw aborted ? new Error(`request timed out after ${opts.timeoutMs}ms`) : err
    } finally {
      clearTimeout(timer)
    }
  }
  // Unreachable in practice (the loop returns or throws), but satisfies the type.
  throw lastErr ?? new Error('request failed')
}
