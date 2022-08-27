import type { Alea } from "../alea.ts";
import type { Graph, Vertex } from "../graph.ts";

// We have to use `hash.js` because it is synchronous
// we can revisit when we make graph generation lazy / async.
import { hash } from "../deps.ts";
import { assert } from "../deps.ts";

interface Cache {
  create(typename: string, preset: unknown, onMiss: () => Vertex): Vertex;
}

export const cachekey = createCacheKey();

export type CacheValue =
  & Pick<Graph, "roots" | "vertices" | "from" | "to" | "currentId">
  & {
    vertexId: number;
    prngState: number[];
  };

export type CacheStorage = Pick<Map<string, CacheValue>, "get" | "set">;

interface CacheOptions {
  source: string;
  seed: Alea;
  graph: Graph;
  storage: CacheStorage;
}
export function createCache(options: CacheOptions): Cache {
  let { graph, seed, storage } = options;
  let key = cachekey.schema(options.source);

  return {
    create(typename, preset, onMiss) {
      let { next, value: thisKey } = key.create(typename, preset);

      console.log({ thisKey })
      let vertex: Vertex;
      if (storage.get(thisKey)) {
        let cacheValue = storage.get(thisKey);
        assert(!!cacheValue);
        let { roots, vertices, from, to, currentId, prngState } = cacheValue;
        seed.importState(prngState);
        Object.assign(graph, {
          currentId,
          roots,
          vertices,
          from,
          to,
        });
        vertex = graph.vertices[cacheValue.vertexId];
        assert(
          !!vertex,
          `cache hit for key ${key}, but vertex was not in the graph!`,
        );
      } else {
        vertex = onMiss();
        let { roots, vertices, from, to, currentId } = graph;
        storage.set(thisKey, {
          prngState: seed.exportState(),
          currentId,
          vertexId: vertex.id,
          roots,
          vertices,
          from,
          to,
        });
      }
      key = next;
      return vertex;
    },
  };
}

export const NullCache: Cache = {
  create: (_typename, _preset, onMiss) => onMiss(),
};

export interface CacheKey {
  ancestors: string[];
  schema(source: string): CacheKey;
  create(typename: string, preset?: unknown): { next: CacheKey; value: string };
}

function createCacheKey(
  provenance: string[] = [],
  versionId: string[] = [],
): CacheKey {
  return {
    ancestors: provenance,
    schema(source) {
      let newVersionId = hash.sha256().update(source).digest("hex");
      return createCacheKey(provenance, [newVersionId]);
    },
    create(typename, preset) {
      let args = preset != null ? [typename, preset] : [typename];
      let key = provenance.concat(
        `create(${args.map((arg) => JSON.stringify(arg)).join(",")})`,
      );
      return {
        value: [key.join("->")].concat(versionId).join("@"),
        next: createCacheKey(key, versionId),
      };
    },
  };
}
