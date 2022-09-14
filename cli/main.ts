import { main } from "./graphql/server.ts";
import { parse, path } from "./deps.ts";

import type { MainOptions } from "./types.ts";

let args = parse(Deno.args, {
  default: {
    "factory": "factory.ts",
  },
  alias: {
    "f": "factory",
  },
});

const getModuleName = (str: string) => path.parse(str).dir ? str : `./${str}`;

async function parseOptions(
  args: ReturnType<typeof parse>,
): Promise<MainOptions> {
  let { default: factory } = await import(getModuleName(args.factory));

  //TODO: validate that the factory is a Graphgen object and is define, etc...
  return {
    factory,
  };
}

let options = await parseOptions(args);

await main(options);
