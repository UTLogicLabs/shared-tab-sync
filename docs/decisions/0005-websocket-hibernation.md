# ADR-0005 — WebSocket Hibernation API for Real-Time Transport

**Status:** Accepted
**Date:** 2026-07-13

## Context

The brief specified a plain `ws`-based Node WebSocket server. Cloudflare Workers cannot host a persistent process the way `ws` requires — a Worker instance is ephemeral and event-driven. Durable Objects are the structural replacement: a DO can accept and hold WebSocket connections for as long as it's active, and Cloudflare's Hibernation API lets it evict idle connections from memory (and bill zero compute) while keeping the socket open from the client's perspective.

## Decision

Use the **WebSocket Hibernation API** (`ctx.acceptWebSocket`, tagged sockets, `serializeAttachment`/`deserializeAttachment`) inside each room's `RoomObject`, rather than a plain always-on `fetch`-held connection or an external `ws` server.

## Rationale

- Structurally required: Workers have no persistent process to run a standalone `ws` server on.
- Hibernation means an idle room (open tabs, no activity) costs nothing while sockets stay connected from the browser's point of view — no forced reconnects, no polling fallback needed.
- `serializeAttachment`/`deserializeAttachment` lets per-socket identity (`clientId`, `displayName`) survive hibernation without an in-memory map that would be lost on eviction — presence can be reconstructed purely from `ctx.getWebSockets()` at any time.

## Consequences

- All real-time logic must be written against the DO's `webSocketMessage`/`webSocketClose`/`webSocketError` handlers, not a generic Node `ws` event API — no direct portability from `ws`-based code.
- Presence is inherently ephemeral and reconstructed from live connections rather than persisted, since hibernation/eviction can happen at any time and there is no separate durable presence store to keep in sync.
