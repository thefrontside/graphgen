import crypto from 'crypto';

export interface Distribution<T> {
  description: string;
  sample(seed: Seed): T
}

export interface Seed {
  randomBytes(count: number): Record<number, number>;
}

export const cryptoSeed: Seed = {
  randomBytes(count) {
    return crypto.randomBytes(count);
  }
};

export function constant<T>(value: T): Distribution<T> {
  return {
    description: `constant(${value})`,
    sample: () => value
  };
}
