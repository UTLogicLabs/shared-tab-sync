import type { Env } from "~/durable-objects/RoomObject";
import { getPrisma } from "~/db.server";
import { generateRoomCode } from "~/lib/room-code.server";

const ROOM_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_CODE_COLLISION_RETRIES = 5;

export async function createRoom(env: Env): Promise<string> {
  const prisma = getPrisma(env.shared_tab_sync_db);

  for (let attempt = 0; attempt < MAX_CODE_COLLISION_RETRIES; attempt++) {
    const code = generateRoomCode();
    try {
      await prisma.room.create({
        data: { code, expiresAt: new Date(Date.now() + ROOM_TTL_MS) },
      });
    } catch {
      continue;
    }

    await env.ROOM.getByName(code).init(code);
    return code;
  }

  throw new Error("Failed to generate a unique room code");
}
