# ADR-0010 — Testing Strategy

**Status:** Accepted
**Date:** 2026-07-13

## Context

Same testing stack question `portfolio` already answered: Vitest vs Jest for unit tests, Playwright vs Cypress for e2e, and how to structure test files relative to source.

## Decision

Adopt `portfolio`'s testing strategy unchanged: **Vitest + Testing Library** for unit tests (`tests/` mirroring the `app/` tree), **Playwright** for e2e (`e2e/`, one spec per user flow). Every change to `app/` requires a test — see `CLAUDE.md`.

## Rationale

Reuse decision — `portfolio`'s own ADR-0005 rationale (Vite-native, fast, first-class React Router support) applies unchanged. Real-time/WebSocket-specific testing needs (two concurrent browser contexts for live-propagation checks) are additive to this strategy, not a departure from it — Playwright already supports multiple contexts per test.

## Consequences

- DO/RPC-level logic (e.g. `RoomObject` methods) is tested via Vitest against the Workers runtime pool (`@cloudflare/vitest-pool-workers`), not mocked — see the DO skeleton stage in the build plan.
- Live-propagation and per-client read-state isolation are verified via Playwright with two browser contexts, not just unit-tested in isolation, since the behavior under test is inherently cross-client.
