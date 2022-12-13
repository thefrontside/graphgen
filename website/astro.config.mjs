import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import react from "@astrojs/react";

const { CONTEXT } = process.env;
let site;
switch (CONTEXT) {
  case "dev":
    site = "http://localhost:3000";
  case "preview":
    site = process.env.DEPLOY_URL;
  default:
    site = "https://graphgen.netlify.app";
}

// https://astro.build/config
export default defineConfig({
  integrations: [
    // Enable Preact to support Preact JSX components.
    preact(),
    // Enable React for the Algolia search component.
    react(),
  ],
  site,
  base: "/graphgen",
  trailingSlash: "always",
  outDir: "dist/graphgen",
});
