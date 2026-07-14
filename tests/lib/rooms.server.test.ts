import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoom } from "~/lib/rooms.server";

const { createMock, deleteMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("~/db.server", () => ({
  getPrisma: () => ({ room: { create: createMock, delete: deleteMock } }),
}));

vi.mock("~/lib/room-code.server", () => {
  let counter = 0;
  return {
    generateRoomCode: vi.fn(() => `code${++counter}`),
  };
});

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });
}

function makeEnv(init = vi.fn(async () => undefined)) {
  return {
    shared_tab_sync_db: {},
    ROOM: { getByName: () => ({ init }) },
  } as never;
}

describe("createRoom", () => {
  beforeEach(() => {
    createMock.mockReset();
    deleteMock.mockReset();
  });

  it("returns the generated code and initializes the DO on the happy path", async () => {
    createMock.mockResolvedValueOnce(undefined);
    const init = vi.fn(async () => undefined);

    const code = await createRoom(makeEnv(init));

    expect(code).toMatch(/^code\d+$/);
    expect(init).toHaveBeenCalledWith(code);
  });

  it("retries on a unique-code collision and succeeds", async () => {
    createMock.mockRejectedValueOnce(uniqueConstraintError());
    createMock.mockResolvedValueOnce(undefined);

    const code = await createRoom(makeEnv());

    expect(code).toMatch(/^code\d+$/);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("rethrows non-collision errors without retrying", async () => {
    const dbError = new Error("D1 unavailable");
    createMock.mockRejectedValueOnce(dbError);

    await expect(createRoom(makeEnv())).rejects.toThrow("D1 unavailable");
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("cleans up the D1 row and rethrows when DO init fails", async () => {
    createMock.mockResolvedValueOnce(undefined);
    deleteMock.mockResolvedValueOnce(undefined);
    const initError = new Error("DO unreachable");
    const init = vi.fn(async () => {
      throw initError;
    });

    await expect(createRoom(makeEnv(init))).rejects.toThrow("DO unreachable");
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});
