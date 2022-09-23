const { createGraphGen, weighted } = require("@frontside/graphgen");
const { fakergen } = require("./fakerGen.ts");
const fs = require('fs');
const path = require('path');

const lifecycles = weighted([["deprecated", .15], ["experimental", .5], [
  "production",
  .35,
]]);

const gen = (info) => {
  if (info.method === "@backstage/component.lifecycle") {
    return lifecycles.sample(info.seed);
  } else {
    return info.next();
  }
};

const source = String(fs.readFileSync(path.join(__dirname, 'world.graphql')));

module.exports = createGraphGen({
  seed: "factory",
  source,
  sourceName: "world.graphql",
  generate: [gen, fakergen],
  compute: {
    "User.name": ({ displayName }) =>
      `${displayName.toLowerCase().replace(/\s+/g, ".")}`,
    "User.email": ({ name }) => `${name}@example.com`,
    "Group.name": ({ department }) => `${department.toLowerCase()}-department`,
    "Group.description": ({ department }) => `${department} Department`,
    "Group.displayName": ({ department }) => `${department} Department`,
    "Group.email": ({ department }) => `${department.toLowerCase()}@acme.com`,

    "Component.type": () => "website",

    "System.name": ({ displayName }) =>
      displayName.toLowerCase().replace(/\s+/g, "-"),
    "System.description": ({ displayName }) =>
      `Everything related to ${displayName}`,
  },
});
