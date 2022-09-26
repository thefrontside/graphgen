import { defineConfig } from "npm:vite";
import react from "npm:@vitejs/plugin-react";
import tsconfigPaths from "npm:vite-tsconfig-paths";
import "npm:vue@3.2.39/compiler-sfc";

// https://vitejs.dev/config/
export default defineConfig({
  root: "app",
  plugins: [react(), tsconfigPaths()],
  build: {
    watch: {},
    emptyOutDir: true,
    outDir: "../dist",
    sourcemap: "inline",
  },
});
