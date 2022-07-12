import { beforeEach, describe, expect, it } from "./suite.ts";
import { createGraphGen, FieldGen, GraphGen } from "../mod.ts";

describe("using graphql", () => {
  let graphgen: GraphGen;

  beforeEach(() => {
    graphgen = createGraphGen({
      source: `type Person { name: String! }`,
    });
  });

  it("can create something with default values", () => {
    let person = graphgen.create("Person");
    expect(typeof person.name).toEqual("string");
    expect(person.wut).not.toBeDefined();
  });

  it("can pass bespoke values in the create", () => {
    expect(graphgen.create("Person", {
      name: "Bob Dobalina",
    })).toEqual({
      name: "Bob Dobalina",
    });
  });

  it.ignore("can pass bespoke values for relationships the create", () => {});

  it("fails to create anything that is not defined", () => {
    expect(() => graphgen.create("Bucksnort")).toThrow("unknown");
  });

  describe("a global custom generator per field", () => {
    beforeEach(() => {
      graphgen = createGraphGen({
        source: "type Person { name: String! occupation: String! }",
        fieldgen({ typename, fieldname, fieldtype }) {
          return `${typename}.${fieldname} is a ${fieldtype}`;
        },
      });
    });

    it("uses it when generating fields", () => {
      let person = graphgen.create("Person");
      expect(person.name).toEqual("Person.name is a String");
      expect(person.occupation).toEqual(
        "Person.occupation is a String",
      );
    });

    it("ignores it if a preset value is provided", () => {
      expect(graphgen.create("Person", {
        name: "Bob Dobalina",
      })).toEqual({
        name: "Bob Dobalina",
        occupation: "Person.occupation is a String",
      });
    });
  });

  it("can generate values for something that is nullable", () => {
    let graphgen = createGraphGen({
      seed: () => 0,
      source: `type Person { car: String }`,
    });
    expect(graphgen.create("Person").car).toBeNull();
  });

  it("You can attach a probability that a field will be generated when it is nullable", () => {
    let graphgen = createGraphGen({
      seed: () => 0.65,
      source: `type Person { car: String @has(chance: 0.7)} `,
    });
    expect(graphgen.create("Person").car).toBeNull();

    graphgen = createGraphGen({
      seed: () => 0.9,
      source: `type Person { car: String @has(chance: 0.7)} `,
    });
    expect(graphgen.create("Person").car).not.toBeNull();
  });

  it("is an error to try and attach a less than one probability to a non nullable field", () => {
    expect(() =>
      createGraphGen({
        seed: () => 0,
        source: `type Person { name: String! @has(chance: 0.7)} `,
      })
    ).toThrow();
  });

  it("can use a custom field generator", () => {
    expect(
      createGraphGen({
        source:
          `type Person { name: String! @gen(with: "@faker/name.findName") occupation: String! }`,
        fieldgen({ method, next }) {
          if (method === "@faker/name.findName") {
            return "Bob Dobalina";
          } else {
            return next();
          }
        },
      }).create("Person"),
    ).toEqual({
      name: "Bob Dobalina",
      occupation: "blork",
    });
  });

  it("can use a chain of field generators", () => {
    let name: FieldGen = ({ method, next }) =>
      method.endsWith("name") ? "Charles" : next();
    let occupation: FieldGen = ({ method, next }) =>
      method.endsWith("occupation") ? "Developer" : next();
    let person = createGraphGen({
      source: `type Person { name: String! occupation: String! }`,
      fieldgen: [name, occupation],
    }).create("Person");

    expect(person).toEqual({
      name: "Charles",
      occupation: "Developer",
    });
  });

  describe("relationships", () => {
    it.ignore("can generate fields that reference each other in the graph", () => {
      let source =
        `type Person { name: String!, account: Account! } type Account { owner: Person! }`;
      let person = createGraphGen({
        source,
      }).create("Person");
      expect(person.account).toBeTruthy();
      expect(person.name).toEqual(person.account.name);
    });
  });

  it.ignore("can derive fields from other fields based on the fully reified object", () => {
  });

  it("minimatches", () => {
  });
});
