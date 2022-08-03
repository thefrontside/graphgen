import { Alea } from "./deps.ts";

export interface Alea {
  (): number;
  importState(state: number[]): void;
  exportState(): number[];
}

export function createAlea(seed?: string) {
  return (seed ? new Alea(seed) : new Alea()) as Alea;
}

export function isAlea(value: unknown): value is Alea {
  if (value != null) {
    //deno-lint-ignore no-explicit-any
    return typeof ((value as any).importState) === "function";
  } else {
    return false;
  }
}
