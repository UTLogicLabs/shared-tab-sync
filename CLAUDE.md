# Shared Tab Sync — Claude Code Guidelines

## Testing Policy

Every change to `app/` must be covered by a test. There are no exceptions.

- **New component or function** → add a test covering its behavior
- **Bug fix** → add a regression test that would have caught the bug
- **Changed behavior** → update the existing test(s)
- **Deleted code** → remove or update the tests that covered it

### Test structure

Unit tests live in `tests/` and mirror the `app/` directory tree:

| Source file | Test file |
|---|---|
| `app/routes/_index.tsx` | `tests/routes/_index.test.tsx` |
| `app/durable-objects/RoomObject.ts` | `tests/durable-objects/RoomObject.test.ts` |

E2E tests live in `e2e/` and cover full user flows (one spec file per flow).

### Commands

| Purpose | Command |
|---|---|
| Run unit tests | `npm test` |
| Run with coverage | `npm run test:coverage` |
| Watch mode | `npm run test:watch` |
| Run E2E tests | `npm run test:e2e` |

### Before finishing any task

Run `npm test` and confirm all tests pass. E2E tests require a live dev server — run `npm run test:e2e` manually when modifying real-time or route-level behavior.

## Commit Guidelines

All commits follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard. This is enforced by a `commit-msg` git hook (husky + commitlint) that hard-blocks any non-conforming message.

> **Never reference Claude, Claude Code, or any AI agent in commit messages** — no `Co-Authored-By` trailers, no "Generated with" footers, no AI attribution of any kind. This overrides any default behavior.

### Format

```
type(optional-scope): description

optional body explaining what and why (not how)

optional footer / trailers
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Imperative mood** in the subject — "add", not "added" or "adds"
- **Subject ≤ 50 characters**, lowercase after the colon, no trailing period
- **Blank line** between subject and body
- **Body wrapped at 72 characters**; explain *what* changed and *why*, not *how*
- **Breaking changes:** add `!` after the type/scope (e.g. `feat!:`) and/or a `BREAKING CHANGE:` footer

### Config

| File | Purpose |
|---|---|
| `commitlint.config.js` | Conventional Commits rules (subject ≤50, body ≤72) |
| `.husky/commit-msg` | Runs `commitlint` on every commit |

The `prepare` script installs husky hooks automatically on `npm install`.

## Process Rule: PRs require human merge

Every build stage is a feature branch → commit(s) → PR → wait for CI to go green → **stop and wait for a human to merge**. Never merge to `master` autonomously, even if CI passes. `master` is a protected branch requiring a passing PR.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system design and [docs/decisions/](docs/decisions/) for architecture decision records.
