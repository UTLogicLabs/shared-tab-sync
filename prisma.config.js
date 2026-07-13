import { defineConfig } from "prisma/config";
import { listLocalDatabases } from "@prisma/adapter-d1";

// Find the local Wrangler D1 SQLite file for incremental migrate diff.
// listLocalDatabases() returns an array of absolute file paths.
let datasourceUrl;
try {
  const paths = await listLocalDatabases();
  // Exclude Wrangler's internal metadata.sqlite; take the first real DB file.
  const dbPath = paths.find((p) => !p.endsWith("metadata.sqlite"));
  if (dbPath) datasourceUrl = `file:${dbPath}`;
} catch {
  // .wrangler/ not yet initialized — db:migrate:init will create it.
}

// Without a URL the Prisma migrate engine has no SQL dialect to target,
// so fall back to a placeholder that is replaced once the DB exists.
datasourceUrl ??= "file:./dev.db";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  datasource: {
    url: datasourceUrl,
  },
});
