import { createBuilder } from "ultra/build.ts";

console.log(import.meta.resolve("./import_map.json"))

const builder = createBuilder({
  browserEntrypoint: import.meta.resolve("./server/client.tsx"),
  serverEntrypoint: import.meta.resolve("./server/static.tsx"),
});

builder.setExcluded([
  "./README.md",
]);

// deno-lint-ignore no-unused-vars
const result = await builder.build();