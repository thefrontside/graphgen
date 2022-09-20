export function assert(
  condition: boolean,
  message?: string,
): asserts condition {
  if (!condition) {
    const errorMessage = message ?? "Assertion failed";

    throw new Error(errorMessage);
  }
}
