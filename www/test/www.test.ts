import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "../../test/suite.ts";
import { ServerContext } from "$fresh/server.ts";

import manifest from "../fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "../twind.config.ts";

describe("www", () => {
  let controller: AbortController;
  beforeEach(async function () {
    controller = new AbortController();
    let opts = {
      port: 9999,
      plugins: [twindPlugin(twindConfig)],
      signal: controller.signal,
    };
    let cxt = await ServerContext.fromManifest(manifest, {
      plugins: [twindPlugin(twindConfig)],
    });
    await new Promise((onListen) => {
      Deno.serve(
        {
          ...opts,
          signal: controller.signal,
          onListen,
        },
        cxt.handler() as Deno.ServeHandler
      );
    });
  });
  afterEach(async () => {
    controller.abort();
    await closed;
  });
  it("sets the base element to '/' if no X-Base header is present", async () => {
    let response = await fetch("http://localhost:9999/docs/introduction");
    let html = await response.text();
    expect(response.ok).toEqual(true);
    expect(response.headers.get("Content-Type")).toMatch("text/html");
    expect(html).toContain('<base href="/"');
  });

  it("sets a base element if the X-Base header is present", async () => {
    let response = await fetch("http://localhost:9999/docs/introduction", {
      headers: {
        "X-Base-Url": "http://example.com/path/to/subdir/",
      },
    });
    let html = await response.text();

    expect(response.ok).toEqual(true);
    expect(response.headers.get("Content-Type")).toMatch("text/html");
    expect(html).toContain(
      `<base href="http://example.com/path/to/subdir/" />`
    );
  });
});
