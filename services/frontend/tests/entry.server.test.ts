// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { EntryContext } from "react-router";

vi.mock("react-dom/server", () => ({
  renderToPipeableStream: vi.fn(() => {
    throw new Error("boom");
  })
}));

describe("handleRequest", () => {
  it("does not schedule a timeout when renderToPipeableStream throws", async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    try {
      const { default: handleRequest } = await import("../app/entry.server");
      const request = new Request("http://example.com");
      const responseHeaders = new Headers();
      const routerContext = { isSpaMode: false } as EntryContext;

      await expect(
        handleRequest(request, 200, responseHeaders, routerContext, {})
      ).rejects.toThrow("boom");

      expect(setTimeoutSpy).not.toHaveBeenCalled();
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });
});
