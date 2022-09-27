import {Environment, Network, RecordSource, Store} from 'relay-runtime';
import { fetchGraphQL } from './fetchGraphql.ts';

async function fetchRelay(params: { text: string, name: string }, variables: Record<string, unknown>) {
  console.log(params);
  console.log(`fetching query ${params.name} with ${JSON.stringify(variables)}`);
  return fetchGraphQL(params.text, variables);
}

export function createRelayEnvironment() {
  return new Environment({
    network: Network.create(fetchRelay),
    store: new Store(new RecordSource()),
  });
}