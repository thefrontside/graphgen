import { createFactory } from "../factory/factory.ts";

export function makeContext() {
  const factory = createFactory();

  factory.create('Component')

  console.log([...factory.all('Component')]);
  
  return {
    graph: factory.graph
  }
}