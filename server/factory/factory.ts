import { createGraphGen, weighted } from '../../mod.ts'
import type { GraphGen, Generate, CacheStorage } from '../../mod.ts';
import { fakergen } from "./fakerGen.ts";
import flatCache from 'flat-cache';

export type Factory = GraphGen;

type Lifecycle = 'deprecated' | 'experimental' | 'production';

const lifecycles = weighted<Lifecycle>([['deprecated', .15], ['experimental', .5], ['production', .35]]);

const gen: Generate = (info) => {
  if (info.method === "@backstage/component.lifecycle") {
    return lifecycles.sample(info.seed);
  } else {
    return info.next();
  }
}


function createCacheStorage(): CacheStorage {
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

export function createFactory(seed = 'factory'): Factory {
  const storage = createCacheStorage();
  const source = Deno.readTextFileSync('world.graphql');

  return createGraphGen({
    seed,
    storage,
    source,
    sourceName,
    // importMap: {
    //   "@frontside/compute": import("./fakerGen.ts").compute
    // },
    generate: [gen, fakergen],
    compute: {
      "User.name": ({ displayName }) => `${displayName.toLowerCase().replace(/\s+/g, '.')}`,
      "User.email": ({ name }) => `${name}@example.com`,
      "Group.name": ({ department }) => `${department.toLowerCase()}-department`,
      "Group.description": ({ department }) => `${department} Department`,
      "Group.displayName": ({ department }) => `${department} Department`,
      "Group.email": ({ department }) => `${department.toLowerCase()}@acme.com`,

      "Component.type": () => "website",

      "System.name": ({ displayName }) => displayName.toLowerCase().replace(/\s+/g, '-'),
      "System.description": ({ displayName }) => `Everything related to ${displayName}`,
    },
  });
}
