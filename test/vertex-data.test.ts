import { assertEquals } from "./asserts.ts";
import { constant, createGraph, createVertex, Distribution } from "../mod.ts";

const { test } = Deno;

test("field generation according to the distributions defined in vertex type", () => {
  let countries = sequence("a few countries", [
    "US",
    "ZA",
  ]);
  let states = sequence("US States", [
    "TX",
    "AK",
  ]);
  let graph = createGraph({
    types: {
      vertex: [{
        name: "LDAPProfile",
        relationships: [],
        data() {
          return {
            description: `State and Country`,
            sample(seed) {
              return {
                country: countries.sample(seed),
                state: states.sample(seed),
              };
            },
          };
        },
      }],
    },
  });

  let [one, two] = [
    createVertex(graph, "LDAPProfile"),
    createVertex(graph, "LDAPProfile"),
  ];

  assertEquals(one.data.country, "US");
  assertEquals(one.data.state, "TX");

  assertEquals(two.data.country, "ZA");
  assertEquals(two.data.state, "AK");
});

test("a distribution that follows from generating at an edge traversal, can use the source vertex", () => {
  let countries = sequence("countries", ["US", "UK"]);
  let cities = sequence("cities", ["Glasgow", "Austin"]);
  let graph = createGraph({
    types: {
      vertex: [{
        name: "Country",
        relationships: [],
        data: {
          [`City.country`]: (source) => {
            if (source.data === "Glasgow") {
              return constant("UK");
            } else {
              return constant("US");
            }
          },
          root: () => countries,
        },
      }, {
        name: "City",
        relationships: [{
          type: "City.country",
          direction: "from",
          size: constant(1),
        }],
        data: () => cities,
      }],
      edge: [{
        name: "City.country",
        from: "City",
        to: "Country",
      }],
    },
  });

  let [[one], [two]] = [
    createVertex(graph, "City"),
    createVertex(graph, "City"),
  ].map((city) => graph.from[city.id].map((edge) => graph.vertices[edge.to]));

  assertEquals(one.data, "UK");
  assertEquals(two.data, "US");
});

function sequence<T>(
  description: string,
  values: [first: T, ...rest: T[]],
): Distribution<T> {
  let [first, ...rest] = values;
  let iterator = (function* generate() {
    start: {
      for (let value of [first, ...rest]) {
        yield value;
      }
      break start;
    }
    return first;
  })();

  return {
    description,
    sample: () => iterator.next().value,
  };
}
