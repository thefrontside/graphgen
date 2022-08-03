import { beforeEach, describe, expect, it } from "./suite.ts";
import { createGraphGen, Generate, GraphGen, Vertex } from "../mod.ts";
import { cachekey } from "../src/cache.ts";
import { Alea, createAlea } from "../src/alea.ts";

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

    it("fails to create anything that is not defined", () => {
      expect(() => graphgen.create("Bucksnort")).toThrow("unknown");
    });

    it("can retrieve a list for a type", () => {
      graphgen.create("Person", { name: "Bob" });
      graphgen.create("Person", { name: "Alice" });
      graphgen.create("Person", { name: "Brian" });

      let all = [...graphgen.all("Person")];

      expect(all.map((p) => p.name)).toEqual(["Bob", "Alice", "Brian"]);
    });

    it("can retrieve a list for a type", () => {
      let all = [...graphgen.createMany("Person", 3)];

      expect(all).toHaveLength(3);
    });

    it("assigns an id and corresponding typename to each node", () => {
      let person = graphgen.create("Person");
      expect(person.id).toBe("1");
      expect(person.__typename).toBe("Person");
    });
  });

  describe("a global custom generator per field", () => {
    beforeEach(() => {
      graphgen = createGraphGen({
        source: "type Person { name: String! occupation: String! }",
        generate({ typename, fieldname, fieldtype }) {
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

    it('can preset "many" relationships', () => {
      let person = createGraphGen({
        source: `
type Person { name: String! accounts: [Account] }
type Account { name: String! }`,
      }).create("Person", {
        accounts: [{
          name: `Checking`,
        }],
      });
      expect(person.accounts[0]?.name).toEqual("Checking");
    });
  });

  it("can generate values for something that is nullable", () => {
    let graphgen = createGraphGen({
      seed: always(0),
      source: `type Person { car: String }`,
    });
    expect(graphgen.create("Person").car).toBeNull();
  });

  it("You can attach a probability that a field will be generated when it is nullable", () => {
    let graphgen = createGraphGen({
      seed: always(.65),
      source: `type Person { car: String @has(chance: 0.7)} `,
    });
    expect(graphgen.create("Person").car).toBeNull();

    graphgen = createGraphGen({
      seed: always(.9),
      source: `type Person { car: String @has(chance: 0.7)} `,
    });
    expect(graphgen.create("Person").car).not.toBeNull();
  });

  it("is an error to try and attach a less than one probability to a non nullable field", () => {
    expect(() =>
      createGraphGen({
        seed: always(0),
        source: `type Person { name: String! @has(chance: 0.7)} `,
      })
    ).toThrow();
  });

  it("can use a custom field generator", () => {
    let person = createGraphGen({
      source:
        `type Person { name: String! @gen(with: "@faker/name.findName") occupation: String! }`,
      generate({ method, next }) {
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
      generate({ method, args, next }) {
        if (method === "@fn/join") {
          return args.join(" ");
        } else {
          return next();
        }
      },
    }).create("Person");
    expect(person.name).toEqual("Bob Dobalina");
  });

  it("can pass a graphql ListValue as args to the @gen directive", () => {
    let person = createGraphGen({
      source:
        `type Person { name: String! @gen(with: "@fn/join" args: [["Bob", "Smith"]])  }`,
      generate({ method, args, next }) {
        if (method === "@fn/join") {
          if (Array.isArray(args[0])) {
            return args[0].join(" ");
          }
        } else {
          return next();
        }
      },
    }).create("Person");

    expect(person.name).toBe("Bob Smith");
  });

  it("can pass a graphql NullValue as args to the @gen directive", () => {
    let person = createGraphGen({
      source:
        `type Person { name: String! @gen(with: "@fn/string" args: [null])  }`,
      generate({ method, args, next }) {
        if (method === "@fn/string") {
          return args.map(String).join();
        } else {
          return next();
        }
      },
    }).create("Person");

    expect(person.name).toBe("null");
  });

  it("can use a chain of field generators", () => {
    let name: Generate = ({ method, next }) =>
      method.endsWith("name") ? "Charles" : next();
    let occupation: Generate = ({ method, next }) =>
      method.endsWith("occupation") ? "Developer" : next();
    let person = createGraphGen({
      source: `type Person { name: String! occupation: String! }`,
      generate: [name, occupation],
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
    expect(person.accounts.length).toEqual(4);
    for (let account of person.accounts) {
      expect(account.owner).toEqual(person);
    }
  });

  it("can compute properties", () => {
    let person = createGraphGen({
      source: `
type Person { firstName: String! lastName: String! name: String! @computed }
`,
      generate(info) {
        return info.fieldname;
      },
      compute: {
        "Person.name": (person: Record<string, unknown>) =>
          `${person.firstName} ${person.lastName}`,
      },
    }).create("Person");
    expect(person.name).toEqual("firstName lastName");
  });

  it("does not call computed for properties that exist in the preset", () => {
    let person = createGraphGen({
      source: `
type Person { firstName: String! lastName: String! name: String! @computed }
`,
      generate(info) {
        return info.fieldname;
      },
      compute: {
        "Person.name": (person: Record<string, unknown>) =>
          `${person.firstName} ${person.lastName}`,
      },
    }).create("Person", {
      firstName: "Sue",
      lastName: "Barker",
      name: "Bob Jones",
    });

    expect(person.name).toEqual("Bob Jones");
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

  it("can pass nested bespoke values for relationships to create()", () => {
    let person = createGraphGen({
      source: `
type Person { account: Account! }
type Account { bank: Bank! }
type Bank { name: String! }
`,
    }).create("Person", {
      account: {
        bank: {
          name: "US Bank",
        },
      },
    });
    expect(person.account.bank.name).toEqual("US Bank");
  });

  it("should create an array non-nullable list type fields", () => {
    let person = createGraphGen({
      source: `
type Person { name: String! accounts: [Account]! }
type Account { name: String! }`,
    }).create("Person");

    expect(Array.isArray(person.accounts)).toBe(true);
  });

  it.ignore("forbids putting a @size on single relationships", () => {
    expect(() => {
      createGraphGen({
        source: `type Person { name: String @size(max: 5) }`,
      });
    }).toThrow("xyz");
  });

  it.ignore("can report multiple errors in a single invocation", () => {});

  describe("caching", () => {
    it("can load values from a cache", () => {
      let bob: Vertex = {
        type: "Person",
        id: 1,
        data: {
          name: "Bob",
        },
      };
      let source = `type Person { name: String! }`;

      let storage = new Map([
        [cachekey.schema(source).create("Person").value, {
          prngState: createAlea().exportState(),
          currentId: 2,
          vertexId: 1,
          roots: {
            Person: {
              1: bob,
            },
          },
          vertices: {
            1: bob,
          },
          from: {},
          to: {},
        }],
      ]);

      let factory = createGraphGen({
        source,
        storage,
      });

      let person = factory.create("Person");
      expect(person.name).toEqual("Bob");
      let other = factory.create("Person");
      expect(other.name).not.toEqual("Bob");
    });

    it("generates the same objects depending on whether it picked up in the middle", () => {
      let storage = new Map();

      let factory = createGraphGen({
        source: `type Person { name: String! random: String! }`,
        storage,
      });

      let bob = factory.create("Person", { name: "Bob" });

      let alice = factory.create("Person", { name: "Alice" });

      let snapshot = new Map(storage);

      let pedro = factory.create("Person", { name: "Pedro" });

      let factory2 = createGraphGen({
        source: `type Person { name: String! random: String! }`,
        storage: snapshot,
      });

      let bob2 = factory2.create("Person", { name: "Bob" });
      let alice2 = factory2.create("Person", { name: "Alice" });
      let pedro2 = factory2.create("Person", { name: "Pedro" });

      expect(bob).toEqual(bob2);
      expect(alice).toEqual(alice2);
      expect(pedro).toEqual(pedro2);
    });

    it("uses different cache keys for different schema versions", () => {
      let v1 = `type Person { name: String! }`;
      let v2 = `type Person { name: String! address: String! }`;

      let prngState = createAlea().exportState();

      let bob: Vertex = {
        type: "Person",
        id: 1,
        data: {
          name: "Bob",
        },
      };

      let pedro: Vertex = {
        type: "Person",
        id: 1,
        data: {
          name: "Pedro",
        },
      };

      let storage = new Map([
        [cachekey.schema(v1).create("Person").value, {
          prngState,
          currentId: 2,
          vertexId: 1,
          roots: {
            Person: {
              1: bob,
            },
          },
          vertices: {
            1: bob,
          },
          from: {},
          to: {},
        }],
        [cachekey.schema(v2).create("Person").value, {
          prngState,
          currentId: 2,
          vertexId: 1,
          roots: {
            Person: {
              1: pedro,
            },
          },
          vertices: {
            1: pedro,
          },
          from: {},
          to: {},
        }],
      ]);

      expect(
        createGraphGen({
          source: `type Person { name: String! }`,
          storage,
        }).create("Person").name,
      ).toEqual("Bob");

      expect(
        createGraphGen({
          source: `type Person { name: String! address: String! }`,
          storage,
        }).create("Person").name,
      ).toEqual("Pedro");
    });

    it.ignore("caches edges", () => {});
    it.ignore("loads different values for different sequences of graph mutation", () => {
    });
  });
});

function always(num: number): Alea {
  return Object.assign(() => num, {
    importState() {},
    exportState: () => [],
  });
}
