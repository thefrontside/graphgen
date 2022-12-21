import { describe, expect, it } from "./suite.ts";
import type { GenerateInfo } from "../src/graphql/types.ts";
import { createDispatch } from "../src/graphql/dispatch.ts";

describe("dispatch", () => {
  it("can dispatch a method by name directly", () => {
    let { dispatch } = createDispatch({
      methods: {
        "Person.name": () => "Bob",
      },
      patterns: {},
    });
    let result = dispatch("Person.name", "", []);
    expect(result.handled).toBe(true);
    expect(result.value).toBe("Bob");
  });
  it("can dispatch by a pattern", () => {
    let { dispatch } = createDispatch({
      methods: {
        "Person.name": () => "Bob",
      },
      patterns: {
        "*.name": "Person.name",
      },
    });
    let result = dispatch("Employee.name", "", []);
    expect(result.handled).toBeTruthy();
    expect(result.value).toBe("Bob");
  });

  it("does not handle things it does not know about", () => {
    let { dispatch } = createDispatch({
      methods: {
        "Person.name": () => "Bob",
      },
      patterns: {
        "*.name": "Person.name",
      },
    });
    let result = dispatch("Employee.occupation", "", []);
    expect(result.handled).toBe(false);
  });

  it("can take a custom context usable within the dispatch", () => {
    let { dispatch } = createDispatch({
      methods: {
        "Person.name": (context) => `Bob${context}`,
      },
      patterns: {},
      context: (input: number) => input * 2,
    });

    let result = dispatch("Person.name", 4, []);
    expect(result.value).toEqual("Bob8");
  });

  it("can specify arguments when matching a pattern", () => {
    let { dispatch } = createDispatch({
      methods: {
        "Person.name": (_, args) => `Bob ${args.join(" ")}`,
      },
      patterns: {
        "*.name": ["Person.name", "Dolubrius", "Dobalina"],
      },
    });
    let result = dispatch("Employee.name", void 0, []);

    expect(result.handled).toBe(true);
    expect(result.value).toEqual("Bob Dolubrius Dobalina");
  });

  it("can be used directly as a function", () => {
    let dispatch = createDispatch<GenerateInfo>({
      methods: {
        "Person.name": () => "Bob",
      },
      patterns: {},
    });
    let result = dispatch({
      method: "Person.name",
      args: [],
      typename: "Person",
      fieldname: "name",
      fieldtype: "String",
      seed: () => Math.random(),
      next: () => "Did Not Match",
    });
    expect(result).toBe("Bob");
  });
});
