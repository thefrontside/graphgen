---
title: Fields
description: Control how each type's fields are generated
layout: ../../layouts/MainLayout.astro
---

**Graphgen uses GraphQL to express its data generation schema**

[GraphQL] is a language designed specifically for querying networks of typed
data. The same properties that make it good for that purpose also  makes it well
suited to _generate_ networks of typed data. To generate this data, Graphgen
looks at the structure of a graphql schema, and creates data that conforms to
that schema

### Basic Types

Without providing any information than just a type's declaration, Graphgen will
introspect its fields an creates a record that will satisfy their constraints.
So, for exampel, we can take the following declaration for a `Person` type:

``` graphql
type Person {
  name: String!
  age: Int!
}
```

And graphgen will create a record with a name that is a string, and an age which
is an integer. We can see this in action if we executed the following.

``` javascript
graphgen.create("Person")
// {
//   name: "Person.name 5057341"
//   age: 302
// }
```

### Custom Generators

While technically "Person.name 5057341" is a string, and `302` is an integer,
as _actual_ values for a name and an age they are terrible! Luckily graphgen has
a mechanism to make this data much more realistic. To use it we have to do two
things: first, attach a custom directive to the field saying what generation
method we want this field to use, and second, we have to define that generation
method when we create our graphgen. Let's see what the directives look like:

``` javascript
type Person {
  name: String! @gen(with: "human.fullName")
  age: String! @gen(with: "human.age")
}
```

We're now telling graphen not to use just any old method to generate
the `Person` fields, but instead to use the specific `human.fullName`
method to generate the name, and `human.age` method to generate the
age.

In order to specify their implementations we have to pass a
"generate" function to graphgen that will match generation methods and
return appropriate data for them. The goal here is not to re-invent
the wheel, and GraphGen is not prescriptive about how you generate
yoru data. In this example, we'll use [FakerJS] to generate our field
data.


``` javascript
import * as faker from "@fakerjs/core";

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
  }
});
```

We can now see how much better the data is with our new generation methods:

``` javascript
graphgen.create("Person");
//{
//  name: "Ms. Teri Rutherford",
//  age: 61
//}

```

>💡In practice, you will rarely specify generators manually and attach
> them to fields. Instead, you will import them wholesale and match
> them against field names using patterns. To learn more see the
> section on [Method Dispatch][method-dispatch]


### Optional Fields

Not everybody has a car. Not everyone has a nickname, and so when
generating data, you want to express the variation of data presence
by marking that it is optional. To do this, we use the [natural
syntax of GraphQL][graphql-nullable-syntax] which uses `!` to indicate
that a field is required vs nothing to indicate that a field is
optional. We can see in the following example how because not
everybody has a bank account number, we can specify it as an optional
`Int`

``` graphql
type Person {
  bankAccountNumber: Int
}
```

Notice the lack of `!` on the field definition. Now, graphgen will
assign a person a bank account number half the time, but the other
half it won't.

#### Accounting for chance

But what if 90% of people have a bank account? Then it doesn't make any sense
to generate a bank account number half the time. Instead we need to instruct graphgen that it should be doing it nine times out of ten. We can do this by attaching a `@has(chance)` directive to the field. To take the preceding example:

``` graphql
type Person {
  bankAccountNumber: Int @has(chance: 0.9)
}
```

This tells GraphGen to generate a bank acount number for 90% of people.

[GraphQL]: https://graphql.org
[FakerJS]: https://fakerjs.dev
[method-dispatch]: ./method-dispatch
[graphql-nullable-syntax]: https://graphql.org/learn/schema/#object-types-and-fields
