import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    root: path.resolve(__dirname),
    include: ["**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 60000,
    setupFiles: [path.resolve(__dirname, "setup.ts")],
  },
});
