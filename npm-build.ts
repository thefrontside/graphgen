import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    deno: false
  },
  test: false,
  typeCheck: false,
  compilerOptions: {
    target: "ES2020"
  },
  package: {
    // package.json properties
    name: "@frontside/graphgen",
    version: "1.2.3",
    description: "Graph Generator",
    license: "MIT",
    repository: {
      author: "engineering@frontside.com",
      type: "git",
      url: "git+https://github.com/thefrontside/graphgen.git",
    },
    bugs: {
      url: "https://github.com/thefrontside/graphgen/issues",
    },
    engines: {
      node: ">= 14"
    }
  },
});
