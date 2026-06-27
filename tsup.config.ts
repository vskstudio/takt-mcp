import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node18',
  // Shebang so the published bin is directly executable by npx/MCP clients.
  banner: { js: '#!/usr/bin/env node' },
})
