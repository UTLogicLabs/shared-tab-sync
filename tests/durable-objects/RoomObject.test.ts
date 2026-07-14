import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("RoomObject", () => {
  it("persists the room code after init", async () => {
    const stub = env.ROOM.getByName("room-a");

    await stub.init("room-a");

    expect(await stub.getSnapshot()).toEqual({ code: "room-a" });
  });

  it("returns no code before init", async () => {
    const stub = env.ROOM.getByName("room-untouched");

    expect(await stub.getSnapshot()).toEqual({ code: null });
  });

  it("isolates storage between different room codes", async () => {
    const stubA = env.ROOM.getByName("room-b");
    const stubC = env.ROOM.getByName("room-c");

    await stubA.init("room-b");

    expect(await stubA.getSnapshot()).toEqual({ code: "room-b" });
    expect(await stubC.getSnapshot()).toEqual({ code: null });
  });
});
