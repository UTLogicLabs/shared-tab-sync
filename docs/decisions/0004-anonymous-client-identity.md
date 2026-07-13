# ADR-0004 — Anonymous Client-ID Identity Model

**Status:** Accepted
**Date:** 2026-07-13

## Context

The product requires per-person read/unread state and presence within a room, but the founding user story is explicitly "join without accounts." An accounts-based identity model (email/password, magic link) was considered and rejected — it would contradict that user story and add scope (signup, session management, merging anonymous and authenticated identity) disproportionate to the product's size.

## Decision

Identity is a **client-generated id**, created via `crypto.randomUUID()` on first visit to any room, stored in `localStorage` (cookie fallback), paired with a display name the user picks per room. This `clientId` is sent as a WebSocket connection query param and is the only identity the server ever sees — there is no server-issued session token and no account.

## Rationale

- Fully preserves the "no accounts" user story.
- `read_state` and presence key naturally off `clientId` — a stable-enough identifier for a single browser/device across a session, without needing server-side auth.
- Client fully owns and controls its own identity; the server only upserts a `clients` row for display purposes (name, last-seen).

## Consequences

- Identity does **not** persist across devices or after clearing browser storage — a user who switches devices or clears storage appears as a new person with reset read-state. Accepted tradeoff for a no-accounts product.
- Two people could theoretically pick the same display name in one room — not disambiguated beyond the (invisible) `clientId`; acceptable since the room is small and informal by design.
