# ADR-0009 — Tailwind CSS v4

**Status:** Accepted
**Date:** 2026-07-13

## Context

The user asked for this project to share its visual theme with the sibling `portfolio` project, which uses Tailwind CSS v4's CSS-first configuration (no `tailwind.config.js`; tokens live in `app/app.css` under `@theme {}`).

## Decision

Adopt Tailwind CSS v4 unchanged from `portfolio`, including its OKLCH color token set (`--color-primary`, `--color-secondary`, background/foreground/muted/border pairs), class-based dark mode via `@variant dark (&:where(.dark, .dark *))`, and the Inter/JetBrains Mono font stack. See `app/app.css`.

## Rationale

This is a reuse decision, not a re-derivation — `portfolio`'s own rationale for choosing Tailwind v4's CSS-first config (see its ADR-0004) applies unchanged here, and sharing the exact token values is the point: it's what makes the two apps look like one system.

## Consequences

- Any theme change intended to apply to both projects must be made in both `app.css` files by hand — there is no shared package distributing the tokens.
- Component styling conventions (flat `app/components/`, hand-rolled, no shadcn/Radix) are also carried over for visual/structural consistency.
