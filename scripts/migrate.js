#!/usr/bin/env node
/**
 * Diffs the local D1 database against prisma/schema.prisma and, if there are
 * changes, writes them into a new numbered file under migrations/ (Wrangler's
 * migration format) and applies it locally. Remote D1 is never diffed
 * directly — Prisma has no way to introspect it, so drift can only be
 * detected against the local D1 file. Production is kept in sync by
 * committing the generated migration file and running
 * `wrangler d1 migrations apply --remote` in CI (see db:migrate:apply:remote).
 *
 * Usage:
 *   node scripts/migrate.js <migration-name>
 */

import { spawnSync } from "node:child_process";
import { unlinkSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const name = process.argv[2];
if (!name) {
  console.error("Usage: node scripts/migrate.js <migration-name>");
  process.exit(1);
}

const diffResult = spawnSync(
  "npx",
  [
    "prisma",
    "migrate",
    "diff",
    "--from-config-datasource",
    "--to-schema",
    "prisma/schema.prisma",
    "--script",
    "--output",
    "migration.sql",
    "--exit-code",
  ],
  { stdio: "inherit" }
);

if (diffResult.status === 0) {
  console.log("✓ local D1 schema is already up to date — nothing to generate.");
  if (existsSync("migration.sql")) unlinkSync("migration.sql");
  process.exit(0);
}

if (diffResult.status !== 2) {
  console.error(`✘ prisma migrate diff failed (exit ${diffResult.status}).`);
  if (existsSync("migration.sql")) unlinkSync("migration.sql");
  process.exit(diffResult.status ?? 1);
}

const createResult = spawnSync(
  "npx",
  ["wrangler", "d1", "migrations", "create", "shared-tab-sync-db", name],
  { stdio: "pipe", encoding: "utf8" }
);
process.stdout.write(createResult.stdout ?? "");
process.stderr.write(createResult.stderr ?? "");

const combinedOutput = `${createResult.stdout ?? ""}\n${createResult.stderr ?? ""}`;
const match = combinedOutput.match(/([^\s"']*migrations[/\\]\d+_[^\s"']+\.sql)/);
const migrationPath = match?.[1]?.trim();
if (createResult.status !== 0 || !migrationPath) {
  console.error("✘ failed to create a new migration file.");
  if (existsSync("migration.sql")) unlinkSync("migration.sql");
  process.exit(createResult.status ?? 1);
}

const header = readFileSync(migrationPath, "utf8");
const diffSql = readFileSync("migration.sql", "utf8");
writeFileSync(migrationPath, `${header}${diffSql}`);
unlinkSync("migration.sql");

console.log(`✓ wrote ${migrationPath}`);

const applyResult = spawnSync(
  "npx",
  ["wrangler", "d1", "migrations", "apply", "shared-tab-sync-db", "--local"],
  { stdio: "inherit" }
);

process.exit(applyResult.status ?? 0);
