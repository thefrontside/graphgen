const { createGraphGen } = require("@frontside/graphgen");

module.exports = createGraphGen({
  source: "type Component { name: String! }",
  sourceName: "world.graphql",
});
