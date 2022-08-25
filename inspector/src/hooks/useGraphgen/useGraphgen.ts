import type { GraphGen, GraphQLOptions } from '@frontside/graphgen';
import { createGraphGen } from '@frontside/graphgen';
import { useEffect, useState } from 'react';

export function useGraphgen({
  source,
  seed = 'factory'
}: { source: string | undefined, seed?: string }): GraphGen<Record<string, any>> | undefined {
  const [schema, setSchema] = useState<string>();

  useEffect(() => {
    async function fetchSchema() {
      if(!source) {
        return;
      }
      
      const response = await fetch(source);

      const text = await response.text();

      console.log(text);

      setSchema(text);
    }

    if(!source) {
      return;
    }

    fetchSchema().catch(console.error)
  }, []);

  if(!schema) {
    return;
  }
  
  return createGraphGen({ seed, source: schema });
}