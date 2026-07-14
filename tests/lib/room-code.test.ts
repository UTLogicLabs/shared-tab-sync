import { describe, expect, it } from "vitest";
import { generateRoomCode } from "~/lib/room-code.server";

describe("generateRoomCode", () => {
  it("generates an 8-character code", () => {
    expect(generateRoomCode()).toHaveLength(8);
  });

  it("only uses characters from the ambiguity-reduced alphabet", () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[abcdefghjkmnpqrstvwxyz23456789]+$/);
  });

  it("generates different codes across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
