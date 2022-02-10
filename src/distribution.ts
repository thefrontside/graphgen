import { gaussian } from "https://deno.land/x/gaussian/mod.ts";

export interface Distribution<T> {
  description: string;
  sample(seed: Seed): T;
}

export interface Seed {
  (): number;
}

export function constant<T>(value: T): Distribution<T> {
  return {
    description: `constant(${value})`,
    sample: () => value,
  };
}

export function uniform<T>(values: [T, ...T[]]): Distribution<T> {
  return {
    description: `uniform distribution`,
    sample(seed) {
      let idx = Math.floor(seed() * values.length);
      return values[idx];
    },
  };
}

type Weight<T> = [T, number];

export function weighted<T>(
  weights: [Weight<T>, ...Weight<T>[]],
): Distribution<T> {
  let totalWeight = weights.reduce((total, [, weight]) => total + weight, 0);
  let probabilities = weights
    .sort(([, wa], [_, wb]) => wa - wb)
    .map(([value, weight]) => [value, weight / totalWeight] as Weight<T>);

  return {
    description: "weighted",
    sample(seed) {
      let trial = seed();
      let sum = 0;
      for (let [value, probability] of probabilities) {
        sum += probability;
        if (trial <= sum) {
          return value;
        }
      }
      // return the most probable as an escape hatch
      return probabilities[0][0];
    },
  };
}

export interface NormalOptions {
  min?: number;
  max?: number;
  mean: number;
  standardDeviation: number;
}

export function normal(options: NormalOptions): Distribution<number> {
  let min = options.min || 0;
  let max = options.max || 10000;

  return {
    description: `normal(${JSON.stringify(options)})`,
    sample(seed) {
      let distribution = gaussian(options.mean, options.standardDeviation);

      while (true) {
        let guess = Math.floor(distribution.ppf(seed()));
        if (guess < max && guess > min) {
          return guess;
        }
      }
    },
  };
}
