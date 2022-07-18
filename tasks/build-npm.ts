import { build, emptyDir } from "https://deno.land/x/dnt@0.28.0/mod.ts";

const outDir = "./build/npm";

await emptyDir(outDir);

let version = Deno.env.get("NPM_VERSION");
if (!version) {
  throw new Error("NPM_VERSION is required to build npm package");
}

await build({
  entryPoints: ["./mod.ts"],
  outDir,
  shims: {
    deno: false,
  },
  test: false,
  typeCheck: false,
  compilerOptions: {
    target: "ES2020",
    sourceMap: true,
  },
  package: {
    // package.json properties
    name: "@frontside/graphgen",
    version,
    description: "Graph Generator",
    license: "ISC",
    repository: {
      author: "engineering@frontside.com",
      type: "git",
      url: "git+https://github.com/thefrontside/graphgen.git",
    },
    bugs: {
      url: "https://github.com/thefrontside/graphgen/issues",
    },
    engines: {
      node: ">= 14",
    },
  },
  mappings: {
    "https://esm.sh/graphql@16.5.0/graphql": {
      name: "graphql",
      version: "16.5.0",
      peerDependency: false,
    }
  }
});

await Deno.copyFile("README.md", `${outDir}/README.md`);
