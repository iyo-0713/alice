import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw";

if (typeof window !== "undefined") {
  const globalWindow = window as typeof window & {
    __vite_plugin_react_preamble_installed__?: boolean;
    $RefreshReg$?: (type: unknown, id?: string) => void;
    $RefreshSig$?: () => (type: unknown) => unknown;
  };

  // Vitest doesn't inject the Vite React preamble that the React Router plugin expects.
  globalWindow.__vite_plugin_react_preamble_installed__ = true;
  globalWindow.$RefreshReg$ = () => {};
  globalWindow.$RefreshSig$ = () => (type) => type;
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => cleanup());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
