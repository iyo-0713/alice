import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw";

if (typeof window !== "undefined") {
  const globalWindow = window as typeof window & {
    __vite_plugin_react_preamble_installed__?: boolean;
    $RefreshReg$?: (type: unknown, id?: string) => void;
    $RefreshSig$?: () => (type: unknown) => unknown;
  };

  /*
   * Workaround for Vitest + jsdom: when running tests, Vite does not execute the
   * React plugin preamble that is normally injected into HTML during dev server
   * startup. The React Router Vite plugin assumes those globals exist and
   * asserts their presence; without them, tests can fail early with preamble-
   * missing errors before any component renders. We stub the minimal globals
   * to satisfy that check without enabling React Refresh itself.
   *
   * This can be removed if/when Vitest starts injecting the Vite React preamble
   * in the test environment or the React Router plugin stops requiring it.
   */
  globalWindow.__vite_plugin_react_preamble_installed__ = true;
  globalWindow.$RefreshReg$ = () => {};
  globalWindow.$RefreshSig$ = () => (type) => type;
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => cleanup());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
