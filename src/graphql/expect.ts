import { assert } from "../deps.ts";

export function expect<T>(
  key: string,
  record: Record<string, T>,
  msg?: string,
): T {
  let value = record[key];
  assert(
    value,
    msg ?? `expected map to contain value with key: '${key}', but it did not`,
  );
  return value;
}
