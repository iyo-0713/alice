import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { RouterProvider, createMemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import Index from "../app/routes/_index";
import { server } from "./msw";

const renderWithRouter = () => {
  const router = createMemoryRouter(
    [
      {
        id: "root",
        path: "/",
        element: <Index />
      }
    ],
    { initialEntries: ["/"] }
  );

  return render(<RouterProvider router={router} />);
};

describe("dialogue histories", () => {
  it("renders history titles", async () => {
    server.use(
      http.get("/dialogue/histories", () =>
        HttpResponse.json({
          histories: [
            { id: 1, title: "first", created_at: "2024-01-02T03:04:05Z" },
            { id: 2, title: null, created_at: "2024-01-02T03:04:05Z" }
          ]
        })
      )
    );

    renderWithRouter();

    expect(await screen.findByText("first")).toBeDefined();
    expect(await screen.findByText("(タイトルなし)")).toBeDefined();
  });

  it("shows empty state when no histories", async () => {
    server.use(
      http.get("/dialogue/histories", () =>
        HttpResponse.json({ histories: [] })
      )
    );

    renderWithRouter();

    expect(await screen.findByText("履歴はありません")).toBeDefined();
  });
});
