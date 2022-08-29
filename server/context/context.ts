import { createFactory } from "../factory/factory.ts";

export function makeContext() {
  const factory = createFactory();

  factory.create('Component');
  // for(const root of Object.keys(factory.graph.roots)) {
  //   factory.create(root);
  // }

  return {
    factory
  }
}

export type GraphQLContext = ReturnType<typeof makeContext>;