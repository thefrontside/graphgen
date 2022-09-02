import { createFactory, Factory } from "../factory/factory.ts";
const computedPath = '../factory/computed.ts';

export async function makeContext() {
  // we need to load the schema here also
  const { computed } = await import(computedPath);

  const factory = createFactory(computed, 'inspector');

  return {
    factory
  }
}

export interface GraphQLContext {
  factory: Factory;
}