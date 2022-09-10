import { createGraphGen } from '@frontside/graphgen'
import type { GraphGen } from '@frontside/graphgen';
import { Computed } from '../server/types.ts';

export type Factory = GraphGen;

const sourceName = 'world.graphql';

export function createFactory(computed: Computed, seed = 'factory'): Factory {
  const source = Deno.readTextFileSync('world.graphql');

  return createGraphGen({
    seed,
    source,
    sourceName,
    ...computed
  });
}
