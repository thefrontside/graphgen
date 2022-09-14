import type { GraphGen } from "../../mod.ts";

export interface GraphQLContext {
  factory: GraphGen;
}

export function makeContext(factory: GraphGen) {
  return {
    factory,
  };
}
