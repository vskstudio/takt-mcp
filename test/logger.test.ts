import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLogger, noopLogger } from '../src/logger.js'

function captureStderr() {
  const lines: string[] = []
  const spy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array) => {
    lines.push(String(chunk))
    return true
  })
  return { lines, spy }
}

afterEach(() => vi.restoreAllMocks())

describe('createLogger', () => {
  it('writes debug lines to stderr only when debug is enabled', () => {
    const { lines } = captureStderr()
    createLogger(false).debug('quiet')
    expect(lines).toHaveLength(0)
    createLogger(true).debug('loud', { a: 1 })
    expect(lines.join('')).toContain('takt-mcp debug: loud {"a":1}')
  })

  it('always writes warnings regardless of debug', () => {
    const { lines } = captureStderr()
    createLogger(false).warn('heads up')
    expect(lines.join('')).toContain('takt-mcp warn: heads up')
  })
})

describe('noopLogger', () => {
  it('writes nothing', () => {
    const { lines } = captureStderr()
    noopLogger.debug('x')
    noopLogger.warn('y')
    expect(lines).toHaveLength(0)
  })
})
