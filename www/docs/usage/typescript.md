---
title: Using GraphGen with TypeScript
description: |
  Leverage TypeScript interfaces to typecheck the records returned by your
  factories, as well as to validate your computed field names and your
  generation methods
---
**Type check your records, [computed][] fields, and [presets][]**

GraphGen has builtin support for working with TypeScript. You can use it to add
static type-checking to the records that GraphGen produces, and it will also
make sure that both your computed fields and presets line up.

The first thing to do is to define an TypeScript interface for your
records. For example, if you have the following:

```GraphQL
type Person {
  name: String!
  employer: Business
}

type Business {
  name: String!
  employees: [Person] @inverse(of: `Person`)
}
```

You can define TypeScript interfaces correpsonding to the types in the
schema.

```ts

interface Person {
  name: string;
  employerr: Business;
}

interface Business {
  name: string;
  employees: Person[];
}

interface API {
  Person: Person;
  Business: Business;
}
```

Then, you can use these types to parameterize `createGraphGen()` and
it will place helpful contraints onto the input and outputs of
`create()`.

```ts
let graphgen = createGraphGen<API>();
```

It is now a type error to try and create a record for which there is
no static type.

```ts
//@ts-expect-error "NonEntity" is not a valid record type
graphgen.create("NonEntity")
```

The reference returned by calls to `create()` will now also be
strongly typed:

```ts
let person = graphgen.create("Person"); // works.
// person is inferred to be of type `Person`
```

Presets are also typechecked against `API` so that if you do provide a
value for a preset, it must line up with the properties of the type
for that preset.

```ts
//@ts-expect-error there is no address field on `Person`
graphgen.create("Person", {
  name: "Muffin Man",
  address: "Drury Lane",
});
```

### Computed Properties

GraphGen will also check its type parameter against any computed
properties you define.

```ts

interface Person {
  firstName: String!
  lastName: String!
  fullName: String! @computed
}
let graphgen = createGraphGen<{Person: Person }>({
  source,
  compute: {
    // Ok.
    "Person.fullName": (person) => `${person.firstName} ${person.lastName}`,

    // @ts-expect-error `Person` does not have an `address` property
    "Person.address": () => {/*...*/}
  }
})
```

Furthermore, the computed property function will have its argument
properly configured to be of the correct type. In other words, in this
above expression.

```ts
(person) => `${person.firstName} ${person.lastName}`
```

`person` will be correctly identified as being of type `Person`.

[computed]: docs/basics/computed
[presets]: docs/usage/presets
