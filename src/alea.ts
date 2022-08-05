import { Alea } from "./deps.ts";

export interface Alea {
  (): number;
  importState(state: number[]): void;
  exportState(): number[];
}

export function createAlea(seed?: string): Alea {
  return seed ? new Alea(seed) : new Alea();
}
