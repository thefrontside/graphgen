import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    let base = req.headers.get("x-base-url") ?? req.url;
    let url = new URL(base);
    url.pathname = "docs/introduction";
    let response = Response.redirect(url, 307);
    return response;
  },
};
