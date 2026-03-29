import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  assetsInclude: ["**/*.csv"],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
} as any);
// Cast to any because vitest types might conflict if not handled carefully, 
// but this is the standard way to merge configs.
