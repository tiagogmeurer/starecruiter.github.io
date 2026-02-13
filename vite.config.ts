import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/starecruiter.github.io/",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
