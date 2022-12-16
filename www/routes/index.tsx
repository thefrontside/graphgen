import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    return Response.redirect(new URL("./docs/introduction", req.url));
  },
};
