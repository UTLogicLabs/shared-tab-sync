import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it, vi } from "vitest";
import Home, { action } from "~/routes/_index";

vi.mock("~/lib/rooms.server", () => ({
  createRoom: vi.fn(async () => "abcdefgh"),
}));

describe("Home route", () => {
  it("renders the heading and call to action", () => {
    const Stub = createRoutesStub([{ path: "/", Component: Home }]);
    render(<Stub initialEntries={["/"]} />);

    expect(
      screen.getByRole("heading", { name: /shared tab sync/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/create a room and share the code/i)).toBeInTheDocument();
  });

  it("action creates a room and redirects to it", async () => {
    const response = await action({
      request: new Request("http://localhost/", { method: "POST" }),
      params: {},
      context: { cloudflare: { env: {}, ctx: {} } } as never,
      url: "http://localhost/",
      pattern: "/",
    } as never);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/r/abcdefgh");
  });
});
