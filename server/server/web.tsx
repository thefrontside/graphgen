import { serve } from 'http/server.ts';
import { createServer } from "ultra/server.ts";
import App from "./App.tsx";

const server = await createServer({
  importMapPath: import.meta.resolve("../import_map.json"),
  browserEntrypoint: import.meta.resolve("./client.tsx"),
});

// deno-lint-ignore no-explicit-any
server.get('*', async (context: any) => {
  const result = await server.render(<App />);

  return context.body(result, 200, {
    "content-type": "text/html",
  });
}, {
  port: 8000
});

serve(server.fetch);