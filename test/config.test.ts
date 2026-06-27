import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

describe('loadConfig', () => {
  it('reads base url, key and default org', () => {
    const cfg = loadConfig({
      TAKT_BASE_URL: 'https://takt.example.com/',
      TAKT_API_KEY: 'takt_sk_abc',
      TAKT_ORG: 'acme',
    } as NodeJS.ProcessEnv)
    expect(cfg).toEqual({
      baseUrl: 'https://takt.example.com',
      apiKey: 'takt_sk_abc',
      defaultOrg: 'acme',
      timeoutMs: 15_000,
      maxRetries: 2,
      debug: false,
    })
  })

  it('parses timeout, retries and debug from the environment', () => {
    const cfg = loadConfig({
      TAKT_BASE_URL: 'https://t.io',
      TAKT_API_KEY: 'k',
      TAKT_TIMEOUT_MS: '3000',
      TAKT_MAX_RETRIES: '5',
      TAKT_DEBUG: 'true',
    } as NodeJS.ProcessEnv)
    expect(cfg.timeoutMs).toBe(3_000)
    expect(cfg.maxRetries).toBe(5)
    expect(cfg.debug).toBe(true)
  })

  it('rejects an out-of-range timeout', () => {
    expect(() =>
      loadConfig({ TAKT_BASE_URL: 'https://t.io', TAKT_API_KEY: 'k', TAKT_TIMEOUT_MS: '50' } as NodeJS.ProcessEnv),
    ).toThrow(/TAKT_TIMEOUT_MS/)
  })

  it('strips trailing slashes from the base url', () => {
    const cfg = loadConfig({ TAKT_BASE_URL: 'https://t.io///', TAKT_API_KEY: 'k' } as NodeJS.ProcessEnv)
    expect(cfg.baseUrl).toBe('https://t.io')
    expect(cfg.defaultOrg).toBeUndefined()
  })

  it('requires a base url', () => {
    expect(() => loadConfig({ TAKT_API_KEY: 'k' } as NodeJS.ProcessEnv)).toThrow(/TAKT_BASE_URL is required/)
  })

  it('rejects a non-http base url', () => {
    expect(() => loadConfig({ TAKT_BASE_URL: 'ftp://takt.io', TAKT_API_KEY: 'k' } as NodeJS.ProcessEnv)).toThrow(
      /http/,
    )
  })

  it('requires an api key', () => {
    expect(() => loadConfig({ TAKT_BASE_URL: 'https://t.io' } as NodeJS.ProcessEnv)).toThrow(/TAKT_API_KEY is required/)
  })
})
