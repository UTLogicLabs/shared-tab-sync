# ADR-0001 — React Router v7 (Framework Mode)

**Status:** Accepted
**Date:** 2026-07-13

## Context

The original brief specified "Remix." Remix v2's framework has since merged into React Router v7's framework mode — the same file-based routing, `loader`/`action` model, and SSR pipeline, distributed as `react-router` rather than a separate package. The sibling project `portfolio` already made this call (see its own ADR-0001) and deploys it successfully to Cloudflare Workers.

## Decision

Use **React Router v7 in framework mode**, matching `portfolio`.

## Rationale

- React Router v7 *is* Remix's continuation — building on "Remix" today means building on React Router v7, not the deprecated standalone Remix package.
- First-class Cloudflare adapter (`@react-router/cloudflare`) and Vite plugin (`@cloudflare/vite-plugin`) that runs the real Workers runtime in dev — no prod/dev divergence, which matters here since the app also relies on Durable Objects and D1 bindings that only exist in that runtime.
- Reusing the same framework as `portfolio` means the two repos share conventions (routing, loaders/actions, theming setup) without re-deriving them.

## Consequences

- File-based routing conventions apply (`app/routes.ts`, `app/routes/` filename conventions).
- React Router generates types in `.react-router/` — gitignored, referenced via `tsconfig.json`'s `rootDirs`.
- `ssr: true` is required.
