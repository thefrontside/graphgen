import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import react from "@astrojs/react";

let site = "https://graphgen.netlify.app";
if (process.env.CONTEXT === "dev") {
	site = "http://localhost:3000";
} else if (process.env.CONTEXT === "deploy-preview") {
	site = process.env.DEPLOY_URL;
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
