import { join } from "https://deno.land/std@0.205.0/path/join.ts";
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    let base = req.headers.get("x-base-url") ?? req.url;
    let url = new URL(base);
    url.pathname = join(url.pathname, "docs/introduction");
    let response =  Response.redirect(url);
    return response;
  },
};
