import { beforeEach, describe, expect, it } from "./suite.ts";
import { createGraphGen, FieldGen, GraphGen } from "../mod.ts";

describe("using graphql", () => {
  let graphgen: GraphGen;

  describe("for basic generation", () => {
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
      expect(
        graphgen.create("Person", {
          name: "Bob Dobalina",
        }).name,
      ).toEqual("Bob Dobalina");
    });

    it.ignore("can pass bespoke values for relationships the create", () => {});

    it("fails to create anything that is not defined", () => {
      expect(() => graphgen.create("Bucksnort")).toThrow("unknown");
    });
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
        id: "1",
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
    let person = createGraphGen({
      source:
        `type Person { name: String! @gen(with: "@faker/name.findName") occupation: String! }`,
      fieldgen({ method, next }) {
        if (method === "@faker/name.findName") {
          return "Bob Dobalina";
        } else {
          return next();
        }
      },
    }).create("Person");
    expect(person.name).toEqual("Bob Dobalina");
    expect(person.occupation).toMatch(/Person.occupation/);
  });

  it("can pass arguments to a custom field generator", () => {
    let person = createGraphGen({
      source:
      `type Person { name: String! @gen(with: "@fn/join", args: ["Bob", "Dobalina"])  }`,
      fieldgen({ method, args, next }) {
        if (method === "@fn/join") {
          return args.join(" ");
        } else {
          return next();
        }
      },
    }).create("Person");
    expect(person.name).toEqual("Bob Dobalina");
  })

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
      id: "1",
      name: "Charles",
      occupation: "Developer",
    });
  });

  describe("relationships", () => {
    it("can generate 1:1 relationships that reference each other", () => {
      let source =
        `type Person { name: String!, account: Account! } type Account { owner: Person! @inverse(of: "Person.account")}`;
      let person = createGraphGen({
        source,
      }).create("Person");
      expect(person.account).toBeTruthy();
      expect(person.name).toEqual(person.account.owner.name);
    });
  });

  it("does not care the order in which you express inverse relationships", () => {
    let person = createGraphGen({
      source:
        `type Account { owner: Person! @inverse(of: "Person.account")} type Person { name: String!, account: Account! } `,
    }).create("Person");
    expect(person.account).toBeTruthy();
    expect(person.name).toEqual(person.account.owner.name);
  });

  it("can have objects that are related to without an inverse relationship", () => {
    let person = createGraphGen({
      source:
        `type Person { account: Account! } type Account { name: String! }`,
    }).create("Person");
    expect(person.account).toBeDefined();
  });

  it.ignore("does not care if both sides express the inverse relationship", () => {
    let person = createGraphGen({
      source:
        `type Account { owner: Person! @inverse(of: "Person.account")} type Person { name: String!, account: Account! @inverse(of: "Account.owner")} `,
    }).create("Person");
    expect(person.account).toBeTruthy();
    expect(person.name).toEqual(person.account.owner.name);
  });

  it("checks to make sure that inverse relationships exist", () => {
    expect(() => {
      createGraphGen({
        source:
          `type Person { name: String! } type Account { owner: Person! @inverse(of: "floopy")}`,
      });
    }).toThrow("does not exist");
  });

  it("checks to make sure that inverse relationships are of the correct type", () => {
    expect(() => {
      createGraphGen({
        source:
          `type A { s: String! } type B { a: A! @inverse(of: "C.a")} type C { a: A!}`,
      });
    }).toThrow("does not reference type");
  });

  it("uses a normal distribution for 'many' relationships ", () => {
    let person = createGraphGen({
      source:
        `type Person { accounts: [Account] } type Account { owner: Person! @inverse(of: "Person.accounts")}`,
    }).create("Person");

    expect(person.accounts).toBeTruthy();
    expect(person.accounts.length).toBeGreaterThan(1);

    for (let account of person.accounts) {
      expect(account.owner).toEqual(person);
    }
  });

  it("lets you specify your own normal distribution", () => {
    let person = createGraphGen({
      source:
        `type Person { accounts: [Account] @size(mean: 10, standardDeviation: 1) } type Account { owner: Person! @inverse(of: "Person.accounts")}`,
    }).create("Person");
    expect(person.accounts.length).toEqual(9);
  });

  it("forbids putting a @has(chance: 0.7) on a many relationship", () => {
    expect(() => {
      createGraphGen({
        source:
          `type Person { accounts: [Account] @has(chance: 0.7)} type Account { name: String! }`,
      });
    }).toThrow("cannot be used");
  });

  it("can handle polymorphic relationships", () => {
    let person = createGraphGen({
      source: `
type Person { name: String! accounts: [Account] @inverse(of: "Account.owner") }
type Organization { name: String! accounts: [Account] @inverse(of: "Account.owner") }
union Owner = Person | Organization
type Account { owner: Owner! }`,
    }).create("Person");
    expect(person.accounts.length).toEqual(5);
    for (let account of person.accounts) {
      expect(account.owner).toEqual(person);
    }
  });

  it("can compute properties", () => {
    let person = createGraphGen({
      source: `
type Person { firstName: String! lastName: String! name: String! @computed }
`,
      fieldgen(info) {
        return info.fieldname;
      },
      compute: {
        "Person.name": (person: Record<string, unknown>) =>
          `${person.firstName} ${person.lastName}`,
      },
    }).create("Person");
    expect(person.name).toEqual("firstName lastName");
  });

  it("is an error to mark a field as @computed without also having a computation in the compute map", () => {
    expect(() =>
      createGraphGen({
        source: `
type Person { name: String! @computed }
`,
      })
    ).toThrow("nothing registered");
  });

  it.ignore("forbids putting a @size on single relationships", () => {
    expect(() => {
      createGraphGen({
        source: `type Person { name: String @size(max: 5) }`,
      });
    }).toThrow("xyz");
  });

  it.ignore("can derive fields from other fields based on the fully reified object", () => {
  });

  it.ignore("can report multiple errors in a single invocation", () => {});
});
