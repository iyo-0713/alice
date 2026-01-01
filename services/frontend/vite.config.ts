import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [reactRouter()],
  server: {
    proxy: {
      "/dialogue": "http://localhost:8000"
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts?(x)"]
  }
});
