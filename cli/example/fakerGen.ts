const { faker: globalFaker, Faker } = require("@faker-js/faker");
const { createDispatch } = require("@frontside/graphgen");

function createFaker(seed) {
  const faker = new Faker({ locales: globalFaker.locales });
  faker.seed(seed() * 1000);
  return faker;
}

const methods = Object.entries(globalFaker).reduce((methods, [name, mod]) => {
  if (mod) {
    for (const [fn, value] of Object.entries(mod)) {
      if (typeof value === "function") {
        methods[`@faker/${name}.${fn}`] = ({ faker }, args) => {
          return faker[name][fn](...args);
        };
      }
    }
  }
  return methods;
}, {});

const dispatch = createDispatch({
  methods: {
    ...methods,
    "@backstage/tags": ({ faker }) => faker.lorem.words(3).split(" "),
  },
  patterns: {
    "*.firstName": "@faker/name.firstName",
    "*.lastName": "@faker/name.lastName",
    "*.name": "@faker/name.fullName",
    "*.avatar": "@faker/internet.avatar",
    "*.avatarUrl": "@faker/internet.avatar",
    "*.password": "@faker/internet.password",
  },
  context: (info) => ({ ...info, faker: createFaker(info.seed) }),
});

module.exports.fakergen = (info) => {
  const result = dispatch.dispatch(info.method, info, info.args);
  if (result.handled) {
    return result.value;
  } else {
    return info.next();
  }
};
