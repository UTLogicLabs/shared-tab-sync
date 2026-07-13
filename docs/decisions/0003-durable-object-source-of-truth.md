# ADR-0003 — Durable Object SQLite Storage as Room Source of Truth

**Status:** Accepted
**Date:** 2026-07-13

## Context

A room's links, per-`(link, client)` read-state, and live presence need to be read and written by many concurrent clients with strong consistency (no lost updates, no readers seeing a half-applied write), and pushed to all connected clients in real time. Two places could hold this state: Cloudflare D1 (shared, HTTP-backed SQL) or a per-room Durable Object's own embedded SQLite storage.

## Decision

Each room's content lives entirely in its own **`RoomObject` Durable Object**, using the DO's embedded SQLite storage (the current recommended storage class, `new_sqlite_classes`) as the source of truth. D1 is not involved in room content at all — only in room directory/cache lookups (ADR-0002).

## Rationale

- All access to one room's state is already serialized through that room's single DO instance — DO storage gives transactional guarantees for free. Routing the same writes through D1 (HTTP-based, no cross-statement transactions, shared/regional infrastructure) would add latency for zero consistency benefit.
- A chatty room (frequent link-adds, frequent read-state toggles) would otherwise hammer D1 with many small writes; the DO's local SQLite is colocated with the socket connections handling those writes and is effectively free by comparison.
- The DO already holds the live WebSocket connections for the room (via the Hibernation API — ADR-0005), so co-locating the data those sockets read/write in the same instance avoids a network hop between "socket receives a message" and "state that message needs to update."

## Consequences

- Room content is not queryable across rooms without waking each DO individually — acceptable for this product, which has no cross-room reporting/admin requirement.
- The DO's internal schema (`room_meta`, `links`, `read_state`, `clients`) is plain `sql.exec` DDL owned by the `RoomObject` class, not Prisma-managed — there is no cross-room migration tool for it; schema evolution happens via `CREATE TABLE IF NOT EXISTS` in the constructor.
- Room expiry/cleanup (ADR-0006) must coordinate between the DO (which can self-destruct via alarm) and D1 (which tracks `expiresAt` for the sweep) rather than relying on a single source.
