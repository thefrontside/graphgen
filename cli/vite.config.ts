import { defineConfig } from "npm:vite";
import react from "npm:@vitejs/plugin-react";
import tsconfigPaths from "npm:vite-tsconfig-paths";
import "npm:vue@3.2.39/compiler-sfc";

const isDevelopment = Deno.env.get('NODE_ENV') === 'development';

// https://vitejs.dev/config/
export default defineConfig({
  root: "app",
  plugins: [react(), tsconfigPaths()],
  define: {
    'process.env.NODE_ENV': '"development"'
  },
  build: {
    watch: isDevelopment ? {} : undefined,
    emptyOutDir: true,
    mode: Deno.env.get('NODE_ENV') ?? "development",
    outDir: "../dist",
    sourcemap: "inline",
    minify: false,
  },
});
