# Contributing

Thanks for helping improve `takt-mcp`. This is a small, focused codebase — a
Model Context Protocol server that exposes the Takt public read API as tools.

## Getting started

```bash
pnpm install
pnpm test        # vitest, run mode
pnpm lint        # eslint (typescript-eslint)
pnpm typecheck   # tsc --noEmit
pnpm build       # tsup → dist/
```

Node 18+ and pnpm 9 are required (`.nvmrc` pins the dev Node version).

## The gate

Every change must keep the full gate green — it is exactly what CI runs:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

CI runs on Node 18 and 20. CodeQL scans every PR.

## Conventions

- **TypeScript, strict.** `any` is an error (`@typescript-eslint/no-explicit-any`).
- **Few comments.** Explain *why*, not *what*; let the code carry the *what*.
- **No lint suppression.** Fix the root cause rather than disabling a rule.
- **stdout is sacred.** It is the MCP transport. All logs go to stderr via the
  `Logger`; never `console.log`.
- **Never log secrets.** The API key must not appear in any output.
- **Encode path segments.** Splice user input into URLs with `encodeURIComponent`.

## Adding a tool

1. Add a `ToolDef` to `src/tools.ts` (a `name`, `description`, a Zod `shape`, and
   a `run` that calls `client.get`).
2. Cover it in `test/tools.test.ts`, including the stable tool-name list.
3. Document it in the README tool table and the wiki.

## Adding a stat endpoint parameter

Mirror the parameter name and semantics from the Takt OpenAPI contract. Time
filters live in the shared `timeShape` / `timeQuery` helpers.

## Releasing

Releases use [changesets](https://github.com/changesets/changesets):

1. Add a changeset with `pnpm changeset`, describing the change and the semver bump.
2. On merge to `main`, CI opens (or updates) a **Version Packages** PR that applies
   the bump and updates the changelog. Bump `src/version.ts` to match in that PR.
3. Merging the Version Packages PR triggers CI to publish to npm with provenance.

## Commit style

Conventional-commit style messages (`feat:`, `fix:`, `docs:`, `chore:`) with a
clear, present-tense summary.
