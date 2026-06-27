import { describe, expect, it, vi } from 'vitest'
import { tools } from '../src/tools.js'
import type { TaktClient } from '../src/client.js'
import type { Config } from '../src/config.js'

const config: Config = {
  baseUrl: 'https://t.io',
  apiKey: 'k',
  defaultOrg: 'acme',
  timeoutMs: 5_000,
  maxRetries: 0,
  debug: false,
}

function clientSpy() {
  const get = vi.fn(async () => ({ ok: true }))
  return { get } as unknown as TaktClient & { get: ReturnType<typeof vi.fn> }
}

function tool(name: string) {
  const t = tools.find((x) => x.name === name)
  if (!t) throw new Error(`tool ${name} not found`)
  return t
}

describe('tools', () => {
  it('exposes a stable, unique set of tool names', () => {
    const names = tools.map((t) => t.name).sort()
    expect(names).toEqual([
      'get_breakdown',
      'get_funnels',
      'get_goals',
      'get_property_breakdown',
      'get_realtime',
      'get_revenue',
      'get_summary',
      'get_timeseries',
      'list_event_properties',
      'list_sites',
    ])
    expect(new Set(names).size).toBe(names.length)
  })

  it('list_sites uses the default org when none is given', async () => {
    const c = clientSpy()
    await tool('list_sites').run(c, config, {})
    expect(c.get).toHaveBeenCalledWith('/orgs/acme/sites')
  })

  it('list_sites prefers an explicit org', async () => {
    const c = clientSpy()
    await tool('list_sites').run(c, config, { org: 'other' })
    expect(c.get).toHaveBeenCalledWith('/orgs/other/sites')
  })

  it('list_sites errors when no org is available', async () => {
    const c = clientSpy()
    expect(() => tool('list_sites').run(c, { ...config, defaultOrg: undefined }, {})).toThrow(/org/)
  })

  it('get_summary maps compareToPrevious to compare=previous', async () => {
    const c = clientSpy()
    await tool('get_summary').run(c, config, { domain: 'x.io', period: '30d', compareToPrevious: true })
    expect(c.get).toHaveBeenCalledWith('/sites/x.io/stats/summary', {
      period: '30d',
      from: undefined,
      to: undefined,
      tz: undefined,
      compare: 'previous',
    })
  })

  it('get_summary omits compare when not requested', async () => {
    const c = clientSpy()
    await tool('get_summary').run(c, config, { domain: 'x.io' })
    expect(c.get).toHaveBeenCalledWith(
      '/sites/x.io/stats/summary',
      expect.objectContaining({ compare: undefined }),
    )
  })

  it('get_breakdown forwards dimension, country and limit', async () => {
    const c = clientSpy()
    await tool('get_breakdown').run(c, config, { domain: 'x.io', dimension: 'pages', country: 'FR', limit: 5 })
    expect(c.get).toHaveBeenCalledWith(
      '/sites/x.io/stats/breakdown',
      expect.objectContaining({ dimension: 'pages', country: 'FR', limit: 5 }),
    )
  })

  it('encodes the domain into the path (no injection)', async () => {
    const c = clientSpy()
    await tool('get_realtime').run(c, config, { domain: 'a.io/../../admin' })
    expect(c.get).toHaveBeenCalledWith('/sites/a.io%2F..%2F..%2Fadmin/stats/realtime')
  })

  it('get_revenue forwards the event name', async () => {
    const c = clientSpy()
    await tool('get_revenue').run(c, config, { domain: 'x.io', event: 'Purchase' })
    expect(c.get).toHaveBeenCalledWith(
      '/sites/x.io/stats/revenue',
      expect.objectContaining({ event: 'Purchase' }),
    )
  })
})
