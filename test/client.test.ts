import { describe, expect, it, vi } from 'vitest'
import { TaktApiError, TaktClient } from '../src/client.js'
import type { Config } from '../src/config.js'

const config: Config = {
  baseUrl: 'https://takt.example.com',
  apiKey: 'takt_sk_abc',
  timeoutMs: 5_000,
  maxRetries: 0,
  debug: false,
}

function fetchMock(res: { ok?: boolean; status?: number; statusText?: string; body: string }) {
  return vi.fn(async () => ({
    ok: res.ok ?? true,
    status: res.status ?? 200,
    statusText: res.statusText ?? 'OK',
    headers: new Headers(),
    text: async () => res.body,
  })) as unknown as typeof fetch
}

function makeClient(fetchImpl: typeof fetch) {
  return new TaktClient(config, { fetchImpl, http: { maxRetries: 0, sleep: async () => {} } })
}

describe('TaktClient.get', () => {
  it('hits /api/v1 with the bearer token and parses JSON', async () => {
    const fetchImpl = fetchMock({ body: '{"visitors":42}' })
    const client = makeClient(fetchImpl)

    const data = await client.get<{ visitors: number }>('/sites/x.io/stats/summary', { period: '30d' })

    expect(data.visitors).toBe(42)
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(String(url)).toBe('https://takt.example.com/api/v1/sites/x.io/stats/summary?period=30d')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer takt_sk_abc')
  })

  it('omits undefined and empty query params', async () => {
    const fetchImpl = fetchMock({ body: '{}' })
    const client = makeClient(fetchImpl)
    await client.get('/x', { period: '7d', from: undefined, tz: '' })
    const [url] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(String(url)).toBe('https://takt.example.com/api/v1/x?period=7d')
  })

  it('maps a JSON error body to TaktApiError with code + message', async () => {
    const fetchImpl = fetchMock({
      ok: false,
      status: 402,
      body: '{"code":"quota_api_depasse","message":"quota dépassé"}',
    })
    const client = makeClient(fetchImpl)
    await expect(client.get('/x')).rejects.toMatchObject({
      status: 402,
      code: 'quota_api_depasse',
      message: 'quota dépassé',
    })
  })

  it('wraps network failures', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    }) as unknown as typeof fetch
    const client = makeClient(fetchImpl)
    await expect(client.get('/x')).rejects.toBeInstanceOf(TaktApiError)
    await expect(client.get('/x')).rejects.toMatchObject({ code: 'network_error' })
  })
})
