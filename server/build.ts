import { createBuilder } from "ultra/build.ts";

const builder = createBuilder({
  browserEntrypoint: import.meta.resolve("./server/client.tsx"),
  serverEntrypoint: import.meta.resolve("./server/web.tsx"),
});

builder.setExcluded([
  "./README.md",
]);

// deno-lint-ignore no-unused-vars
const result = await builder.build();