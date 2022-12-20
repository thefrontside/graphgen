---
title: Faker Integration
description: |
  How to use the faker.js, the most popular data generation framework for
  generating networks of data.
---

**[Faker.js][faker] has most of the [custom generations][custom-generators]
you'll ever need**

You will rarely write your own custom generators for two reasons. The first is
that it is tedious, and the second is that most of them have already been
written, and furthermore, are being actively maintained by open source
communities.

[Faker][faker] is a very complete, very mature, and very well maintained
generator of mock data which can be easily slotted into the role of generating
the field data for your graph.

There is not currently an off the shelf library to do this for you, but this
recipe is easy to follow and will have you generating "massive amounts of fake
data" in no time.

The strategy is three fold. First we will collect all of the
generation methods in the entire Faker library as and put them under
the `@faker/` namespace, and second, we'll make a very common list of
patterns for accessing those methods. Here's our faker generator:

``` javascript
import { faker as globalFaker, Faker } from "@faker-js/faker";
import { createDispatch } from "@frontside/graphgen";

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

export const fakergen = createDispatch({
  methods,
  patterns: {
    "*.firstName": "@faker/name.firstName",
    "*.lastName": "@faker/name.lastName",
    "*.name": "@faker/name.fullName",
    "*.avatar": "@faker/internet.avatar",
    "*.avatarUrl": "@faker/internet.avatar",
    "*.password": "@faker/internet.password",
  },
  context({ seed }) {
    let faker = new Faker({ locales: globalFaker.locales });
    faker.seed(seed() * 1000);
    return faker;
  },
});

```

We can now use `fakergen` as a generator inside a call to `createGraphGen()`

[faker]: http://fakerjs.dev
[custom-generators]: docs/basics/fields#custom-generators
