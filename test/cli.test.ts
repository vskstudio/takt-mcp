import { execFileSync } from 'node:child_process'
import { mkdtempSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { VERSION } from '../src/version'
import pkg from '../package.json'

const dist = fileURLToPath(new URL('../dist/index.js', import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'takt-mcp-cli-'))
const link = join(dir, 'takt-mcp')
symlinkSync(dist, link)

afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('CLI entrypoint', () => {
  it('keeps VERSION in sync with package.json', () => {
    expect(VERSION).toBe(pkg.version)
  })

  // Regression: npm/npx launch the bin through a node_modules/.bin symlink, so
  // the entrypoint guard must resolve realpath — otherwise the server silently
  // never starts when installed.
  it('runs when invoked through a symlink (npx/.bin case)', () => {
    const out = execFileSync('node', [link, '--version'], { encoding: 'utf8' }).trim()
    expect(out).toBe(VERSION)
  })
})
