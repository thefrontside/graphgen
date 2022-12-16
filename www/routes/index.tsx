import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    let base = req.headers.get("x-base") ?? req.url;
    return Response.redirect(new URL("./docs/introduction", base));
  },
};
