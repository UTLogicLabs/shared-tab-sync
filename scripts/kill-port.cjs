#!/usr/bin/env node
// Kills any process listening on the given port before E2E tests start.
// Works on macOS (lsof) and Linux (fuser).
const { execSync } = require('child_process');
const port = process.argv[2] || '5173';

try {
  execSync(
    `lsof -ti:${port} | xargs kill -9 2>/dev/null; fuser -k ${port}/tcp 2>/dev/null; true`,
    { shell: true, stdio: 'pipe' }
  );
} catch { /* ignore */ }
