import { describe, expect, it, vi } from 'vitest'
import { fetchResilient, type HttpOptions } from '../src/http.js'

const url = new URL('https://takt.example.com/api/v1/x')

function ok(status = 200, headers: Record<string, string> = {}) {
  return { status, headers: new Headers(headers) } as unknown as Response
}

function baseOpts(over: Partial<HttpOptions> = {}): HttpOptions {
  return { timeoutMs: 1_000, maxRetries: 2, sleep: async () => {}, backoffMs: () => 0, ...over }
}

describe('fetchResilient', () => {
  it('returns the first successful response without retrying', async () => {
    const fetchImpl = vi.fn(async () => ok(200)) as unknown as typeof fetch
    const res = await fetchResilient(url, {}, baseOpts({ fetchImpl }))
    expect(res.status).toBe(200)
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
  })

  it('retries on a transient status then succeeds', async () => {
    const responses = [ok(503), ok(200)]
    const fetchImpl = vi.fn(async () => responses.shift()) as unknown as typeof fetch
    const res = await fetchResilient(url, {}, baseOpts({ fetchImpl }))
    expect(res.status).toBe(200)
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2)
  })

  it('drains the response body before retrying', async () => {
    const cancel = vi.fn(async () => {})
    const responses = [
      { status: 503, headers: new Headers(), body: { cancel } } as unknown as Response,
      ok(200),
    ]
    const fetchImpl = vi.fn(async () => responses.shift()) as unknown as typeof fetch
    await fetchResilient(url, {}, baseOpts({ fetchImpl }))
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('honours Retry-After over the default backoff', async () => {
    const responses = [ok(429, { 'retry-after': '2' }), ok(200)]
    const fetchImpl = vi.fn(async () => responses.shift()) as unknown as typeof fetch
    const sleep = vi.fn(async () => {})
    await fetchResilient(url, {}, baseOpts({ fetchImpl, sleep }))
    expect(sleep).toHaveBeenCalledWith(2_000)
  })

  it('gives up after maxRetries and returns the last transient response', async () => {
    const fetchImpl = vi.fn(async () => ok(500)) as unknown as typeof fetch
    const res = await fetchResilient(url, {}, baseOpts({ fetchImpl, maxRetries: 1 }))
    expect(res.status).toBe(500)
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2)
  })

  it('retries network errors then rethrows when exhausted', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNRESET')
    }) as unknown as typeof fetch
    await expect(fetchResilient(url, {}, baseOpts({ fetchImpl, maxRetries: 1 }))).rejects.toThrow(/ECONNRESET/)
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2)
  })

  it('reports a timeout when the request aborts', async () => {
    const fetchImpl = vi.fn(async () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      throw err
    }) as unknown as typeof fetch
    await expect(fetchResilient(url, {}, baseOpts({ fetchImpl, maxRetries: 0 }))).rejects.toThrow(/timed out/)
  })
})
