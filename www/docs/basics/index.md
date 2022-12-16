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

[graphql]: https://graphql.org
[directives]: https://graphql.org/learn/queries/#directives
