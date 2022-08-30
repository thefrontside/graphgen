import { createFactory } from "../factory/factory.ts";

export function makeContext() {
  const factory = createFactory();

  return {
    factory
  }
}

export type GraphQLContext = ReturnType<typeof makeContext>;