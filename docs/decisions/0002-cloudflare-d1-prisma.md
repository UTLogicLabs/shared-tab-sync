# ADR-0002 — Cloudflare D1 + Prisma (Directory-Only Scope)

**Status:** Accepted
**Date:** 2026-07-13

## Context

The brief specified Postgres. Deploying on Cloudflare Workers (see ADR-0001) rules out a persistent Postgres connection pool — Workers have no long-running process to hold one, and Cloudflare's own serverless SQL offering, D1, is what `portfolio` already uses via Prisma + `@prisma/adapter-d1`.

Separately, room state (links, per-client read flags, presence) needs low-latency, transactional, per-room writes — seeing ADR-0003, that state is better served by each room's own Durable Object storage than by D1. That leaves an open question: what, if anything, does D1 hold?

## Decision

Use **D1 via Prisma**, scoped to two directory/cache concerns only:

- `Room` — the code → room mapping and expiry metadata, so a Worker can check "does this code exist / has it expired?" without waking the room's Durable Object.
- `UrlCache` — cross-room title/favicon enrichment cache, since two different rooms pasting the same URL shouldn't both pay the fetch cost.

D1 does **not** hold links, read-state, or presence — see ADR-0003.

## Rationale

- Matches `portfolio`'s existing D1 + Prisma + `@prisma/adapter-d1` pattern (`app/db.server.ts`), reused verbatim.
- D1 is the right tool for data that needs to be queried *across* rooms (expiry sweep, cache lookups) without loading any single room's full state.
- Keeping D1's scope narrow avoids the two-source-of-truth drift that would result from writing room content to both D1 and DO storage.

## Consequences

- `prisma/schema.prisma` only ever grows with directory/cache-shaped models, not room-content models.
- Migrations are applied via Wrangler's D1 migration tracking (`npm run db:migrate:new`), since D1 can't be introspected remotely for diffing.
