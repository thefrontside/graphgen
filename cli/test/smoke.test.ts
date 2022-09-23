import { afterEach, beforeEach, describe, expect, it } from "./suite.ts";

describe("CLI smoke test", () => {
  let process: Deno.Process;

  beforeEach(() => {
    process = Deno.run({
      cmd: ["./graphgen", "--port", "8900", "--factory", "example/factory.ts"],
    });
  });

  afterEach(async () => {
    await process.close();
  });

  it("can start up and we can fetch HTML from it", async () => {
    await eventually(async () => {
      let response = await fetch("http://localhost:8900");
      expect(response.ok).toEqual(true);
      let body = await response.text();
      expect(body).toMatch(/div id="main"/);
    }, 10000);
  });
});

async function eventually(
  assertion: () => Promise<void>,
  timeout: number,
): Promise<void> {
  let lastError: Error | null = null;
  let done = false;
  let timeoutId = null;
  async function runAssertion(): Promise<void> {
    while (!done) {
      try {
        return await assertion();
      } catch (error) {
        lastError = error;
      }
    }
  }

  try {
    return await Promise.race([
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(lastError ?? new Error("timeout")),
          timeout,
        );
      }),
      runAssertion(),
    ]);
  } finally {
    done = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
