import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vite now supports native tsconfig paths resolution
    tsconfigPaths: true,
  } as any,
  assetsInclude: ["**/*.csv"],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
} as any);
