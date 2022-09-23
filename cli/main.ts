import { main } from "./graphql/server.ts";
import { parse, path, serveStatic } from "./deps.ts";
import { serveBundledApp } from "./serve-bundle.ts";
import { createRequire } from "https://deno.land/std@0.151.0/node/module.ts";

import type { MainOptions } from "./types.ts";

let args = parse(Deno.args, {
  default: {
    "factory": "factory.ts",
    "port": 8000,
  },
  alias: {
    "f": "factory",
    "p": "port",
  },
});

const getModuleName = (str: string) => path.parse(str).dir ? str : `./${str}`;

// deno-lint-ignore require-await
async function parseOptions(
  args: ReturnType<typeof parse>,
): Promise<MainOptions> {
  let modulePath = path.resolve(getModuleName(args.factory));
  let require = createRequire(path.dirname(modulePath));
  let mod = require( modulePath);
  let factory = mod.default ?? mod;

  //TODO: validate that the factory is a Graphgen object and is define, etc...

  let app = args["app-path"]
    ? serveStatic({ root: args["app-path"] })
    : serveBundledApp;

  return {
    factory,
    port: Number(args.port),
    app,
  };
}

let options = await parseOptions(args);

await main(options);
