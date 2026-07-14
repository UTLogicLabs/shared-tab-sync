import { Prisma } from "@prisma/client";
import type { Env } from "~/durable-objects/RoomObject";
import { getPrisma } from "~/db.server";
import { generateRoomCode } from "~/lib/room-code.server";

const ROOM_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_CODE_COLLISION_RETRIES = 5;

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createRoom(env: Env): Promise<string> {
  const prisma = getPrisma(env.shared_tab_sync_db);

  for (let attempt = 0; attempt < MAX_CODE_COLLISION_RETRIES; attempt++) {
    const code = generateRoomCode();
    try {
      await prisma.room.create({
        data: { code, expiresAt: new Date(Date.now() + ROOM_TTL_MS) },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        continue;
      }
      throw error;
    }

    try {
      await env.ROOM.getByName(code).init(code);
    } catch (initError) {
      // Best-effort cleanup — if this also fails, surface the original
      // initError rather than masking it with a secondary failure.
      await prisma.room.delete({ where: { code } }).catch(() => {});
      throw initError;
    }

    return code;
  }

  throw new Error("Failed to generate a unique room code");
}
