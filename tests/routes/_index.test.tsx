import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import Home from "~/routes/_index";

describe("Home route", () => {
  it("renders the heading and call to action", () => {
    const Stub = createRoutesStub([{ path: "/", Component: Home }]);
    render(<Stub initialEntries={["/"]} />);

    expect(
      screen.getByRole("heading", { name: /shared tab sync/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/create a room and share the code/i)).toBeInTheDocument();
  });
});
