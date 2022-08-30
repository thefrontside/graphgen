import { GraphGen } from '@frontside/graphgen';
import { createGraphGen } from '@frontside/graphgen';
import { useEffect, useState } from 'react';
import { compute, fakergen, gen } from './compute';
import { join } from 'posix';

interface UseGraphGen { 
  source?: string | undefined;
  seed?: string;
  loaded?: boolean 
}

export function useGraphgen({
  source = 'https://raw.githubusercontent.com/thefrontside/backstage/main/packages/graphgen/src/world.graphql',
  seed = 'factory',
  loaded = false
}: UseGraphGen = {}): GraphGen<Record<string, any>> | undefined {
  const [schema, setSchema] = useState<string>();

  useEffect(() => {
    async function fetchSchema() {
      console.log(source)
      if(!source) {
        return;
      }
      
      const response = await fetch(source);

      const text = await response.text();

      setSchema(text);
    }

    if(!source) {
      return;
    }

    fetchSchema().catch(console.error)
  }, [source]);

  if(!schema || loaded) {
    return;
  }


  return createGraphGen({
    seed,
    source: schema,
    compute,
    generate: [gen, fakergen],
  });
}