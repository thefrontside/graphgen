---
title: Basics
description: |
  GraphGen uses GraphQL to define the method for generating a graph of records
---

**Graphgen uses the [GraphQL][graphql] schema definition language to direct how it
generates data.**

[GraphQL][graphql] is a language designed specifically for querying
networks of typed data. The same properties that make it good for that
purpose also makes it well suited to generate networks of typed
data. To generate this data, Graphgen looks at the structure of a
graphql schema, and creates data that conforms to that schema.

>💡Unlike most systems that use GraphQL, GraphGen does not use it for a server
> API. Instead, it only uses it to define the relationship between data types so
> that it can be used as a guide while generating data of that type.

GraphGen records are expressed as GraphQL types, and properties of those
records are expressed GraphQL fields. You can control and customize the process
of data generation using [GraphQL directives][directives]

### Repeatability and Fixability

While GraphGen uses probability destributions to generate large amounts of
realistic looking data, it does so using a serializeable random number seed.
This is a fancy way of saying that given the same schema and the same set
generation inputs, it will generate the same data in the same order _every
single time_. This makes it suitable for writing tests that rely on stable data,
or for populating a preview environment with a familiar look.

At the same time as being repeatable, graphgen is also _fixable_. This means
that if you have a test case that must have a user name "Angela" from Uruguay,
then you can instruct it to create that user with exactly those properties using
[presets][]

[graphql]: https://graphql.org
[directives]: https://graphql.org/learn/queries/#directives
[presets]: docs/usage/presets
