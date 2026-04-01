import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/plave-tag-action-game/" : "/",
  server: {
    port: 5174
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"]
  }
}));
