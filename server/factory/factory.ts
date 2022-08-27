// deno-lint-ignore-file no-explicit-any
import { CacheValue, createGraphGen, weighted } from '../../mod.ts'
import type { GraphGen, Generate, CacheStorage } from '../../mod.ts';
import { fakergen } from "./fakerGen.ts";
import { existsSync } from 'fs';
import { join } from 'posix';

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

function createCacheStorage(filename: string): CacheStorage {
  let values = {} as Record<string, CacheValue>;
  let unread = true;
  const map = {
    get(key) {
      if (unread) {
        unread = false;
        if (existsSync(filename)) {
          const buffer = Deno.readTextFileSync(filename);
          values = JSON.parse(String(buffer));
        } else {
          values = {};
        }
      }
      return values[key];
    },
    set(key, value) {
      values[key] = value;
      Deno.writeTextFileSync(filename, JSON.stringify(values));
      return map;
    },
  } as CacheStorage;
  return map;
}

// eslint-disable-next-line no-restricted-syntax
const sourceName = 'world.graphql';

export function createFactory(seed = 'factory'): Factory {
  const storage = createCacheStorage('cache.json');
  const source = Deno.readTextFileSync('world.graphql');

  return createGraphGen({
    seed,
    storage,
    source,
    sourceName,
    generate: [gen, fakergen],
    compute: {
      "User.name": ({ displayName }: any) => `${displayName.toLowerCase().replace(/\s+/g, '.')}`,
      "User.email": ({ name }: any) => `${name}@example.com`,
      "Group.name": ({ department }: any) => `${department.toLowerCase()}-department`,
      "Group.description": ({ department }: any) => `${department} Department`,
      "Group.displayName": ({ department }: any) => `${department} Department`,
      "Group.email": ({ department }: any) => `${department.toLowerCase()}@acme.com`,

      "Component.type": () => "website",

      "System.name": ({ displayName }: any) => displayName.toLowerCase().replace(/\s+/g, '-'),
      "System.description": ({ displayName }: any) => `Everything related to ${displayName}`,
    },
  });
}
