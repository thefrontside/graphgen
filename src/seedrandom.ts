import { Seed } from "https://deno.land/x/seed@1.0.0/index.ts";

export function seedrandom(key?: string) {
  let seed = new Seed(key);
  return () => seed.randomFloat();
}
