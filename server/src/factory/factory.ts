import { createGraphGen } from '@frontside/graphgen'
import type { GraphGen, CacheStorage } from '@frontside/graphgen';
import flatCache from 'flat-cache';
import { Computed } from '../server/types.ts';

export type Factory = GraphGen;

function _createCacheStorage(): CacheStorage {
  const cache = flatCache.load('factory', '.cache');

  const map = {
    get(key) {
      return cache.getKey(key);
    },
    set(key, value) {
      cache.setKey(key, value);
      cache.save(true);
      return map;
    },
  } as CacheStorage;
  return map;
}

const sourceName = 'world.graphql';

export function createFactory(computed: Computed, seed = 'factory'): Factory {
  // const storage = createCacheStorage();
  const source = Deno.readTextFileSync('world.graphql');

  return createGraphGen({
    seed,
    // storage,
    source,
    sourceName,
    ...computed
    // importMap: {
    //   "@frontside/compute": import("./fakerGen.ts").compute
    // },
  });
}
