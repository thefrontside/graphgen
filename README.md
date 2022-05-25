## Graphgen

Generate a graph of values declaratively based on probability
distributions

For test cases, local development, and application previews, we already
appreciate the incredible value of having high-fidelity fake data. The
problem is how do we obtain it? And how do we keep it fresh?

The simplest way to accomplish this is with "fixtures": static
snapshots that can be saved on disk and loaded into the
system on demand. However, maintaining such fixtures is a tedious
process because the data must conform to your schema, and as the
schema evolves, so to must your fixtures.

Factories partially alleviate this problem by parameterizing and
automating the generation of parts of your scghema data. That way, as your
schema evolves, rather than having to update entire data sets, you
only have to update your factories. However, this also falls short for
two reasons. First, is that you still have to write and maintain
factories which for large schemas can be cumbersome. The second is
that factories as we know them are really bad at generating _networks_
of data, and so we see hacks and workarounds like `afterCreate()`
hooks to generate related data after a portion of data has been
created. The problem with these is that they
are not declarative (it is very difficult to parameterize afterCreate
hooks), and they are not whole-meal. In other words, they only
consider what happens next after creating a singe datum and not the
entire set as a whole.

Our goal here is to make high fidelity data that

1. is always valid no matter which context it is being generated from
2. requires a minimum of maintenance. Having a representation of your
   schema, whether in SDL, OpenAPI, or even just TypeScript, should be
   sufficient to create a highly realistic data set.

We take a probablistic approach to generating the data where we assume
that our data adheres to some statistical distribution of
values. We can then sample from that distribution to simulate a
realistic value.

## Development

While it works in both browser and Node, [Deno](https://deno.land) is
the primary development tool. You will need to install that first.

checkout:

```text
$ git clone git@github.com:thefrontside/graphgen.git
```

test:

``` text
$ deno test
```


## Areas for Research and Improvement

### Compositional Distributions

### Visualizing Navigator and Editor

### Fit distributions from existing production data

### Thinking the entire production data set as a single value

### Caching and Seeding
