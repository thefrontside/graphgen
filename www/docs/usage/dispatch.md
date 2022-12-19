---
title: Generation Method Dispatch
description: |
  How to be smart about which fields get which data
---

**GraphGen makes it easy to create good data by default**

In the section introducing fields, we [touched very
briefly][fields-generators] on attaching custom generation methods to
fields by using the `@gen` directive.  It is important to know how
this works, but it would not be great if generating your data meant
attaching a `@gen` directive to every single.  Fortunately, GraphGen
allows you to paint with a much larger brush. In this section, we'll
show how you can effeciently write "generation middleware" to quickly
match against hundreds of fields at a time so you don't have to
specify each one individually.

If you don't want to learn about the nitty gritty, but intsead learn
how to use it to accomplish most of what you need, you can skip ahead
to the section describing the [full integration with faker][faker]

### Generation Middlewares

Let's have another look at our example from the [section on fields][fields]. We
created our GraphGen with a `generator` function that receives information about
what needs to be generated, and then make a decision about what to do with it:

```javascript
import { faker } from "@faker-js/faker";

const graphgen = createGraphGen({
  source,
  sourcename: "world.graphql",
  generate(info) {
    switch (info.method) {
      case "human.fullName":
        return faker.name.fullName();
      case "human.age":
        return faker.datatype.number({ max: 100, min: 0 });
      default:
        // fallback to the next generation functions
        return info.next();
    }
  },
});
```

The switch statement decides if each case is one that it will
handle. If it is, then we handle it, otherwise, we "pass it off" to
the other generators further down the line.

If the template for this logic seems familiar, it is probably because
it is based on the concept of ["middleware"][middleware] prevalent
in many HTTP stacks.

But writing `switch` statements for what could be hundreds or even thousands of
fields in your generation schema is no way to live your life. Instead, GraphGen
has a way of specifying the way to generate a value and then apply that value to
many different fields at once called `Dispatch` to use it, you specify a set of
"generation methods" and then provide a set of patterns to match the
fields of your schema to one of those generation methods. To get
started, import the `createDispatch` function.

``` javascript
import { createDispatch } from '@frontside/graphgen';
```

We can use it to implement our example from before by first definting
the name and age methods in the `methods` options, and then matching
them to our fields in our schema with the `patterns` option.

``` javascript
let nameAndAgeGen = createDispatch({
  methods: {
    "human.fullName": () => faker.name.fullName(),
    "human.age": () => faker.datatype.number({ max: 100, min: 0 }),
  },
  patterns: {
    ".name": "human.fullName",
    "*.age": "human.age",
  }
});
```

This resulting function `nameAndAgeGen` is assignable to the
`generate` option of `createGraphGen`:

``` javascript
let graphgen = createDispatch({
  source,
  sourcename: "world.graphql",
  generate: nameAndAgeGen
});
```

Notice that we can now specify our schema without explicity using
`@gen()` directives because our generation dispatch matches the
`Person.name` and `Person.age` fields and automatically applies our
generation methods to them. Not only that, but because we used the
glob patterns `*.name` and `*.age`, these will match not only
`Person.name` and `Person.age`, but also the `name` and `age` fields
of _any_ type. So if we had a type:

``` graphql
type Citizen {
  name: String!
  age: Int!
}
```

It would use the human name and age generation methods.

### Overriding Dispatch

It may not be appropriate however, to use the same generation method
for _every_ instance of a field. For example, what if we have a type
`Dog` which has the same attributes as a person:

```graphql
type Dog {
  name: String!
  age: Int!
}
```

Dogs do not live to the same age as humans, and the set of dog names
does not ovelap overly much with human names. We could define an
alternate set of generators using `createDispatch()` called `dogGen`

``` javascript
let dogGen = createDispatch({
  "methods": {
    "dog.name": () faker.helpers.arrayElement(['Fido', 'Rover', 'Rex']),
    "dog.age": () => faker.datatype.number({ max: 18, min: 1 }),
  },
  "patterns": {
    "Dog.name": "dog.name",
    "Dog.age": "dog.age",
  },
});
```

Now, we can create our graphgen with both generation methods:

``` javascript
createGraphGen({
  source,
  sourcename,
  generate: [dogGen, nameAndAgeGen],
});
```

Because we put `dogGen` first in line, its patterns will take priority.

>💡GraphGen will use the first matching pattern it finds, so put your
> most specific generation methods first, and add your most generic
> `*.` patterns as the last generation middleware. That way they will
> act as a catch all rather than blocking more specific pattern
> matches.

### Dispatch Context

If you need helpers to perform the generation, you can pass the
`context` option to `createDispatch()`. This is a function which takes
the generation context and returns a value. This value will be
passed to all of your generation methods. To see why you might need
this, we can take a sneak peek at the section on [Faker
integration][faker]. In it, we need to create an instance of Faker
with a specific random seed. That way, the values that it generates
will happen in a predictable fashion.

In this example, instead of using the default static faker methods, we
create a faker instance that tracks the graphgen random seed, and use
that inside our generation methods:

``` javascript
let dogGen = createDispatch({
  "methods": {
    "dog.name": ({ faker }) faker.helpers.arrayElement(['Fido', 'Rover', 'Rex']),
    "dog.age": ({ faker }) => faker.datatype.number({ max: 18, min: 1 }),
  },
  "patterns": {
    "Dog.name": "dog.name",
    "Dog.age": "dog.age",
  },
  context: (info) => ({ ...info, faker: createFaker(info.seed) }),
});
```

[fields-generators]: docs/basics/fields#custom-generators
[faker]: docs/usage/faker
[fields]: docs/basics/fields
[middleware]: https://www.moesif.com/blog/engineering/middleware/What-Is-HTTP-Middleware/
