import type { GraphGen } from "../mod.ts";
import { serveStatic } from "./deps.ts";

export interface MainOptions {
  factory: GraphGen;
  port: number;
  app: ReturnType<typeof serveStatic>;
}
