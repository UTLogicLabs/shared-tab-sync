# ADR-0006 — Room Expiry: Cron Sweep + DO Alarm

**Status:** Accepted
**Date:** 2026-07-13

## Context

Rooms should expire after N days of inactivity. Three mechanisms were considered: a Cloudflare Cron Trigger sweeping a D1 timestamp column, a per-room Durable Object alarm, or lazy expiry checked only on access. Each alone has a gap: alarm-only risks leaking a room whose alarm was never set (e.g. a crash during creation) since alarms are best-effort and scoped to a DO that must have been awake to schedule one; cron-only means up to a full sweep-interval of lag and a periodic full-table scan even when nothing has expired; lazy-only means storage is never reclaimed if nobody ever revisits an expired room's code.

## Decision

Use **all three, layered**, not as alternatives:

1. **Cron Trigger** (every 6h) — authoritative sweep of `Room WHERE expiresAt < now()` in D1, deletes the D1 row and tells the corresponding `RoomObject` to `ctx.storage.deleteAll()`.
2. **DO alarm** — each `RoomObject` reschedules `setAlarm(lastActivity + N days)` on every activity-producing call; firing while genuinely idle self-destructs immediately, precisely, with no sweep-interval lag.
3. **Lazy expiry on access** — the room-view loader's D1 `expiresAt` check gates access before touching the DO, so visitors get an immediate 404 on an expired code even if reclamation hasn't run yet.

## Rationale

- The cron sweep is the safety net: bounded staleness, cheap indexed D1 scan, doesn't depend on any DO being awake.
- The alarm is the fast path: precise, no lag, and offloads work from the cron sweep for rooms active enough to be holding a scheduled alarm anyway.
- Lazy expiry is essentially free (the D1 check already happens on every room-view request) and decouples "is this room accessible" from "has its storage actually been reclaimed yet."

## Consequences

- Two places (D1's `Room.expiresAt` and the DO's own `room_meta.last_activity_at`) must both be kept roughly in sync via activity pings — done with a debounce/throttle so a chatty room doesn't spam D1 with updates on every event.
- A room could theoretically be inaccessible (past `expiresAt`) for up to 6 hours before its DO storage is actually reclaimed — acceptable since inaccessibility, not reclamation timing, is what the user story requires.
