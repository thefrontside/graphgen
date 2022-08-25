import { GraphGen } from '@frontside/graphgen';
import { createGraphGen } from '@frontside/graphgen';
import { useEffect, useState } from 'react';
import { compute, fakergen, gen } from './compute';

export function useGraphgen({
  source = 'https://raw.githubusercontent.com/thefrontside/backstage/main/packages/graphgen/src/world.graphql',
  seed = 'factory'
}: { source?: string | undefined, seed?: string } = {}): GraphGen<Record<string, any>> | undefined {
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

  if(!schema) {
    return;
  }
  
  return createGraphGen({
    seed,
    source: schema,
    compute,
    generate: [gen, fakergen],
  });
}