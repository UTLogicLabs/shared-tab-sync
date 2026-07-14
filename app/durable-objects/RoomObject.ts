import { DurableObject } from "cloudflare:workers";

export interface Env {
  shared_tab_sync_db: D1Database;
  ROOM: DurableObjectNamespace<RoomObject>;
}

export class RoomObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => this.migrate());
  }

  private migrate() {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS room_meta (
        code TEXT PRIMARY KEY,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_activity_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  async init(code: string): Promise<void> {
    this.ctx.storage.sql.exec(
      "INSERT OR IGNORE INTO room_meta (code) VALUES (?)",
      code,
    );
  }

  async getSnapshot(): Promise<{ code: string | null }> {
    const row = this.ctx.storage.sql
      .exec<{ code: string }>("SELECT code FROM room_meta LIMIT 1")
      .toArray()[0];
    return { code: row?.code ?? null };
  }
}
