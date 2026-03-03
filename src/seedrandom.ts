import { Seed } from "seed";

export function seedrandom(key?: string) {
  let seed = new Seed(key);
  return () => seed.randomFloat();
}
