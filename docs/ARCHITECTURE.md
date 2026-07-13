# Architecture Overview

## System Diagram

```
Browser (per room, N clients)
  │
  ▼
Cloudflare CDN / Pages
  │  Static assets served from edge cache
  │
  ▼
Cloudflare Workers (SSR + WebSocket upgrade)
  │  React Router v7 request handler — renders HTML on the edge
  │
  ├──▶ D1 (SQLite) — directory + cache only
  │       Room{code, expiresAt} lookup, UrlCache for enrichment
  │       via Prisma + @prisma/adapter-d1
  │
  └──▶ Durable Objects — RoomObject, one per room (by code)
          Source of truth for links, per-client read state, presence
          Holds live WebSocket connections (hibernation API)
```

## Request Lifecycle

1. **Request arrives** at the nearest Cloudflare edge node.
2. Static assets are served directly from the edge cache — no Worker invoked.
3. For HTML pages and WebSocket upgrades, the **Cloudflare Worker** (`workers/app.ts`) receives the request.
4. The Worker calls `createRequestHandler` from `@react-router/cloudflare` for normal page requests.
5. React Router matches the URL to a route in `app/routes/`, calling its `loader`/`action`.
6. Room-scoped routes resolve `env.ROOM.getByName(code)` to reach the room's `RoomObject` for a snapshot (SSR pre-render) or, on the client, to open a WebSocket.
7. Directory-level reads/writes (room existence, expiry, URL cache) go through `getPrisma(env.DB)` in `app/db.server.ts` against D1.
8. The Worker streams the rendered response via `renderToReadableStream` (`app/entry.server.tsx`); `entry.client.tsx` hydrates on the client.

## Real-Time Room Model

```
Client A ──┐                              ┌── Client B
           │  wss://.../r/:code/ws         │
           ▼                              ▼
        RoomObject (Durable Object, keyed by room code)
        ┌──────────────────────────────────────────┐
        │ embedded SQLite storage (source of truth) │
        │  room_meta · links · read_state · clients │
        │ live WebSocket hibernation connections     │
        └──────────────────────────────────────────┘
                       │
                       ▼ (directory ping / cache lookups only)
                      D1: Room{code, expiresAt}, UrlCache
```

All state for a room — links, per-`(link, client)` read flags, and presence — lives in the `RoomObject`'s own embedded SQLite storage, not in D1. Every access to a room is already serialized through its one DO instance, so DO storage gives transactional guarantees for free; D1 stays scoped to what needs to be queried *without* waking a DO (does this code exist/expired? has this URL been enriched before?). See [ADR-0003](decisions/0003-durable-object-source-of-truth.md).

## WebSocket Protocol

JSON frames, discriminated on `type`.

Client → Server: `add-link`, `set-read-state`, `ping`.

Server → Client: `initial-state-sync` (once, on connect), `link-added`, `link-updated` (enrichment completion), `read-state-changed`, `presence-update` (full replace), `error`.

See [ADR-0005](decisions/0005-websocket-hibernation.md).

## Link Enrichment

Paste → immediate `link-added` broadcast with `pending` status → async fetch (5s timeout, first ~64KB only, SSRF-guarded) → `UrlCache` check/write-through in D1 → `link-updated` broadcast. Failure is non-blocking; the link stays visible with its URL/domain. See [ADR-0007](decisions/0007-link-enrichment.md).

## Room Expiry

Belt-and-suspenders: a Cloudflare Cron Trigger sweeps D1 for `expiresAt < now()` as the authoritative cleanup path, each `RoomObject` also self-schedules a `setAlarm` for precise same-instant cleanup, and the room-view loader's D1 check lazily 404s expired codes regardless of whether storage reclamation has run yet. See [ADR-0006](decisions/0006-room-expiry.md).

## Database

Two schemas, split by ownership:

- **DO-internal SQLite** (`RoomObject`, plain `sql.exec` DDL, not Prisma-managed): `room_meta`, `links`, `read_state`, `clients`.
- **D1 via Prisma** (`prisma/schema.prisma`): `Room` (directory row: code, timestamps, expiry) and `UrlCache` (cross-room enrichment cache).

### Schema changes (D1/Prisma side only)

Migration files live in `migrations/` and are applied via Wrangler's own migration tracking, not by diffing remote state — D1 can't be introspected remotely.

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate:new -- <migration-name>` — generates and applies locally.
3. Commit the generated file under `migrations/`.
4. Apply to production: `npm run db:migrate:apply:remote`.

The DO's internal SQLite schema is created/evolved in the `RoomObject` constructor itself (`CREATE TABLE IF NOT EXISTS ...`) — there is no separate migration tool for per-DO storage.

### Per-Request Client

`getPrisma(env.DB)` creates a fresh `PrismaClient` on every request — D1 bindings are request-scoped and there's no connection pool to maintain (D1 is HTTP-backed).

## Environment Strategy

| Concern | Local | Production |
|---|---|---|
| D1 database | Wrangler local emulation (`.wrangler/`) | Cloudflare D1 remote |
| Durable Objects | Miniflare-emulated (`@cloudflare/vite-plugin`) | Cloudflare Workers |
| Worker runtime | `@cloudflare/vite-plugin` (real Workers runtime in dev) | Cloudflare Workers |
| Assets | Vite dev server | Cloudflare Pages CDN |
| Environment variables | `.dev.vars` (gitignored) | Cloudflare Pages secrets |

## Architecture Decision Records

- [ADR-0001 — React Router v7](decisions/0001-react-router-v7.md)
- [ADR-0002 — Cloudflare D1 + Prisma (directory-only scope)](decisions/0002-cloudflare-d1-prisma.md)
- [ADR-0003 — Durable Object SQLite Storage as Room Source of Truth](decisions/0003-durable-object-source-of-truth.md)
- [ADR-0004 — Anonymous Client-ID Identity Model](decisions/0004-anonymous-client-identity.md)
- [ADR-0005 — WebSocket Hibernation API for Real-Time Transport](decisions/0005-websocket-hibernation.md)
- [ADR-0006 — Room Expiry: Cron Sweep + DO Alarm](decisions/0006-room-expiry.md)
- [ADR-0007 — Link Enrichment: Inline Async Fetch + Shared Cache](decisions/0007-link-enrichment.md)
- ADR-0008 — Lamport Clocks for LWW Conflict Resolution *(written when the stretch goal is implemented)*
- [ADR-0009 — Tailwind CSS v4](decisions/0009-tailwind-v4.md)
- [ADR-0010 — Testing Strategy](decisions/0010-testing-strategy.md)
