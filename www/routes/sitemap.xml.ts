import { Handlers } from "$fresh/server.ts";
import { stringify } from "jsr:@libs/xml";

import docs from "../docs/toc.json" with { type: "json" };

export const handler: Handlers = {
  GET(request) {
    let base = new URL(
      request.headers.get("x-base-url") ?? new URL(new URL(request.url).origin),
    );
    
    // Collect all doc paths
    let docPaths = Object.entries(docs).flatMap(([topic, collection]) => {
      let paths = [`docs/${topic}`];
      if ("pages" in collection) {
        paths.push(...collection.pages.map(([id]) => `docs/${topic}/${id}`));
      }
      return paths;
    });

    // Build URL list
    let urls = [
      { loc: String(base) }, // Root index
      ...docPaths.map((path) => ({
        loc: String(new URL(path, base)),
      })),
    ];

    let xml = stringify({
      "@version": "1.0",
      "@encoding": "UTF-8",
      urlset: {
        "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
        url: urls,
      },
    });

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  },
};
