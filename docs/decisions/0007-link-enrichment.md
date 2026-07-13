# ADR-0007 — Link Enrichment: Inline Async Fetch + Shared Cache

**Status:** Accepted
**Date:** 2026-07-13

## Context

Pasted links need a title and favicon rather than showing as raw URLs. Fetching an arbitrary third-party URL can be slow, hang, or point at unreachable/private infrastructure. A separate queue/worker-triggered enrichment job was considered against enrichment done inline within the DO handling the paste.

## Decision

Enrichment happens **inline, asynchronously, inside the `RoomObject`** that received the `add-link` message — not via a separate queue or job runner:

1. Insert the link and broadcast `link-added` immediately with `enrichment_status: pending` (client shows a URL/domain-only placeholder) — this decouples "the link appears live" from "enrichment finished," so a slow fetch never blocks the live-update feel.
2. Check the D1 `UrlCache` (normalized URL key, 7-day TTL) before fetching — cross-room reuse.
3. Fetch with `AbortSignal.timeout(5000)`, reading only the first ~64KB of the response (title/favicon are always in `<head>`), using a lightweight regex/stream scan rather than a full HTML parser.
4. Reject non-http(s) URLs and private/internal IP ranges before fetching (SSRF guard).
5. On completion (success or failure), update the link row, write through to `UrlCache`, and broadcast `link-updated`. Failure is not an error state — the link stays visible with just its URL/domain.

## Rationale

- A queue/job-runner adds infrastructure and latency not justified at this scale — a single room's enrichment volume is low, and the DO already has direct network access and is already the broadcaster of the eventual `link-updated` event.
- The shared `UrlCache` in D1 (not per-room DO storage) means the same URL pasted in different rooms is only ever fetched once per TTL window.
- Timeouts and a capped read size bound the worst case of a slow or malicious response; the SSRF guard bounds the worst case of a malicious URL.

## Consequences

- Enrichment failures are silent from the user's perspective (domain-only display), which is intentional — an unreachable third-party site should never block or error out the board.
- The SSRF guard must be kept in sync with Cloudflare's own network boundaries; a private-IP check happens before every enrichment fetch, not just at link-add validation time (a URL could resolve differently than its lexical `http(s)` form implies).
