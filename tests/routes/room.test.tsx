import { describe, expect, it, vi } from "vitest";
import { loader } from "~/routes/room";

const { findUniqueMock } = vi.hoisted(() => ({ findUniqueMock: vi.fn() }));

vi.mock("~/db.server", () => ({
  getPrisma: () => ({ room: { findUnique: findUniqueMock } }),
}));

function makeContext(getSnapshot = vi.fn(async () => ({ code: "abcdefgh" }))) {
  return {
    cloudflare: {
      env: {
        shared_tab_sync_db: {},
        ROOM: { getByName: () => ({ getSnapshot }) },
      },
      ctx: {},
    },
  } as never;
}

function makeLoaderArgs(code: string) {
  const url = `http://localhost/r/${code}`;
  return {
    params: { code },
    request: new Request(url),
    context: makeContext(),
    url,
    pattern: "/r/:code",
  } as never;
}

describe("room route loader", () => {
  it("404s when the room does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await expect(loader(makeLoaderArgs("missing"))).rejects.toMatchObject({
      status: 404,
    });
  });

  it("404s when the room has expired", async () => {
    findUniqueMock.mockResolvedValueOnce({
      code: "abcdefgh",
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(loader(makeLoaderArgs("abcdefgh"))).rejects.toMatchObject({
      status: 404,
    });
  });

  it("returns the room code and DO snapshot when found", async () => {
    findUniqueMock.mockResolvedValueOnce({
      code: "abcdefgh",
      expiresAt: new Date(Date.now() + 1000),
    });

    const result = await loader(makeLoaderArgs("abcdefgh"));

    expect(result).toEqual({ code: "abcdefgh", snapshot: { code: "abcdefgh" } });
  });
});
