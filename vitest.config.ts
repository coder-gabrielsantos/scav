import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    clearMocks: true,
    // Auth.js usa imports Next sem extensão, resolvidos pelo bundler da aplicação.
    server: { deps: { inline: ["next-auth"] } },
  },
});
