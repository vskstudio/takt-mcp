import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

describe('loadConfig', () => {
  it('reads base url, key and default org', () => {
    const cfg = loadConfig({
      TAKT_BASE_URL: 'https://takt.example.com/',
      TAKT_API_KEY: 'takt_sk_abc',
      TAKT_ORG: 'acme',
    } as NodeJS.ProcessEnv)
    expect(cfg).toEqual({ baseUrl: 'https://takt.example.com', apiKey: 'takt_sk_abc', defaultOrg: 'acme' })
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
    expect(() => loadConfig({ TAKT_BASE_URL: 'takt.io', TAKT_API_KEY: 'k' } as NodeJS.ProcessEnv)).toThrow(
      /http/,
    )
  })

  it('requires an api key', () => {
    expect(() => loadConfig({ TAKT_BASE_URL: 'https://t.io' } as NodeJS.ProcessEnv)).toThrow(/TAKT_API_KEY is required/)
  })
})
