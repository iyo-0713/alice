import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("dialogue form", () => {
  it("renders response on success", async () => {
    server.use(
      http.post("/dialogue", async ({ request }) => {
        const body = (await request.json()) as { input?: string };
        return HttpResponse.json({ response: `echo:${body.input ?? ""}` });
      })
    );

    renderWithRouter();

    await userEvent.type(screen.getByRole("textbox", { name: "入力" }), "hello");
    await userEvent.click(screen.getByRole("button", { name: "送信" }));

    expect(await screen.findByText("echo:hello")).toBeDefined();
  });

  it("shows error details from JSON responses", async () => {
    server.use(
      http.post("/dialogue", () =>
        HttpResponse.json({ message: "invalid input" }, { status: 400 })
      )
    );

    renderWithRouter();

    await userEvent.type(screen.getByRole("textbox", { name: "入力" }), "oops");
    await userEvent.click(screen.getByRole("button", { name: "送信" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("400");
    expect(alert.textContent).toContain("invalid input");
  });

  it("shows status for empty error responses", async () => {
    server.use(
      http.post("/dialogue", () => new HttpResponse(null, { status: 500 }))
    );

    renderWithRouter();

    await userEvent.type(screen.getByRole("textbox", { name: "入力" }), "oops");
    await userEvent.click(screen.getByRole("button", { name: "送信" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("500");
  });

  it("shows plain error body for non-JSON responses", async () => {
    server.use(
      http.post("/dialogue", () =>
        HttpResponse.text("bad request", { status: 400 })
      )
    );

    renderWithRouter();

    await userEvent.type(screen.getByRole("textbox", { name: "入力" }), "oops");
    await userEvent.click(screen.getByRole("button", { name: "送信" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("400");
    expect(alert.textContent).toContain("bad request");
  });

  it("shows format error for non-JSON success responses", async () => {
    server.use(
      http.post("/dialogue", () => HttpResponse.text("ok", { status: 200 }))
    );

    renderWithRouter();

    await userEvent.type(screen.getByRole("textbox", { name: "入力" }), "ping");
    await userEvent.click(screen.getByRole("button", { name: "送信" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("応答形式が不正です");
  });
});
