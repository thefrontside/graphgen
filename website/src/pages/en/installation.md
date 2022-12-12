---
title: Installation
description: Get graphgen installed and creating data
layout: ../../layouts/MainLayout.astro
---

### 1. Get the code

> Graphgen can be used in both Node and Deno, however most code examples will be
> for Node.

#### NPM

``` shellsession
$ npm i @frontside/graphgen
```

```typescript
import { createGraphGen } from "@frontside/graphgen";
```

#### Deno

```typescript
import { createGraphGen } from "https://deno.land/x/graphgen/mod.ts";
```

### 2. Create your world

Graphgen uses [GraphQL](https://graphql.org) to express the shape of the
generated data, including relationships. Create a `world.graphql` file and add a
type to it.

``` graphql
type Article {
  title: String!
}

type Author {
  name: String!
  articles: [Article] @size(mean: 5, max: 20)
}
```

### 3. Create your generator

``` javascript
import { readFileSync } from "fs";
import { createGraphGen } from "@frontside/graphgen"

const source = readFileSync("./world.graphql");

const graphgen = createGraphGen({
  source,
  sourcename: "world.graphql"
});
```

### 4. Generate realistic data

``` javascript
let author = graphgen.create("Author");
for (let article of author.articles) {
  console.log(`${author.name} wrote ${article.title}`);
}
```
