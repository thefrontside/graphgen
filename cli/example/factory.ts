import { createGraphGen } from "../../mod.ts";

export default createGraphGen({
  source: "type Component { name: String! }",
  sourceName: "world.graphql",
});
