---
title: Relationships
description: Generating related data
layout: ../../layouts/MainLayout.astro
---

**Generating the shape of your data's network is more important than generating
the shape of each record.**

People have friends. Services have customers. Organizations have members. In
short, records are related to each other. In fact, GraphGen actually generates
the complete network of relationships between records _before_ it generates the
values for the records themselves.

Like "normal" fields, Relationships are declared in GraphGen are declared using
natural GraphQL syntax. The following illustrates a relationship between people
and the businesses that employ them (assuming a 5% unemployment rate):

```graphql
type Person {
  name: String!
  employer: Business @has(chance: .95)
}

type Business {
  name: String!
}
```

Now, when we create a `Person`, GraphGen will also create an Employer for them
automatically.

```javascript
let person = graphgen.create("Person");
person.employer.name; //=> Acme Corp, LLC
```

### One to Many

While the `Person` type in our previous example had a single Employer, we can
also approach the relationhsip from the opposit side. Instead of A person having
an employer, we could also say that an employer _has many_ employees. We express
this using [GraphQL list syntax][graphql-list-syntax]

```graphql
type Business {
  employees: [Person]
}

type Person {
  name: String!
}
```

> 💡Non-null modifiers do not have any effect on list fields.

Now when you create a Business, it will have a related list of employees:

```javascript
let business = graphgen.create("Business");
business.employees.length; //=> 5
business.employees[0].name; //=> Bob Martin
```

#### Controlling the size of relationships

A business with one thousand employees is common-place, but a person with one
thousand children would definitely raise some eyebrows. There's no
one-size-fits-all, which is why GraphGen allows you to customize how many
related records to generate. To do this, it uses a probabilistic approach. We
can use the `@size()` directive to say that "the average business" has at least
1000 employees, and then graphgen will select a number of employees that feels
right given those constraints.

```graphql
type Busines {
  employees: [Person] @size(mean: 1000, min: 1)
}
```

> 💡the `@size()` directive can only be applied to lists of related types.

Given this information, grahgen will generate for you businesses with 900
employees. Others will have 1200, and still others may have as few as five, but
the majority will be centered around the parameters you set.

For a full description, see the reference for the [`@size`][size] directive.

### Referential Integrity

If you're using graphgen to serve data from a simulated service, then
it's not enough that a Business has a list of Employees, and that a Person has
an employer. Those records should point to each other and be the same actual
data structure in memory. GraphGen lets you do this with the
[`@inverse`][inverse] directive. Here's the previous example that "links up" the
Business and Employee records:

``` graphql
type Person {
  employer: Business @has(chance: .95)
}

type Business {
  employees: [Person] @inverse(of: "Person.employer") @size(mean: 1000, min: 1)
}
```

When GraphGen creates a Person with an employer, that person will automatically
be listed inside its employees. By the same token, when a business is created,
each of its employees will have a back-reference to it.

```javascript
let person = graphgen.create("Person");
person.employer.employees.includes(person) //=> true

let business = graphgen.create("Business");
for (let employee of busines.employees) {
  assert(employee.employer === business);
}
```

### Coping with Cyclic Graphs

One problem that immediately arises the moment you have a self-referential type
is the problem of cyclic graphs. For example, suppose we want to model the data
inside of a social network. As we know, the entire point is to relate people to
people. We might want to model it like this:

``` GraphQl
type Person {
  friends: [Person]
}
```

However this also presents a problem. If we create a Person, which creates 10
friends who are also people so they in turn create 10 more friends, the graph
quickly explodes into the infinite. In reality, we can have massively
interconnected networks of people because the networks turn back in on
themselves and multiple people will be friends with the same person, so if we
trace all of the relationships, it make take awhile, but they will ultimately be
finite.

GraphGen simulates this with the concept of "affinity." The affinity
of a relationship as it pertains to GraphGen is the probability that
any two nodes in a population are connected by that relationship.

When generating a graph, GraphGen will use the affinity of a relationship to
decide how ofter to reuse existing records, or to create a new one from
scratch. In our previous example of a social network, let's say that the average
user has about 10 frientds, and that the probability that any two users are
connected as friends is 10%. We would represent this like so:

``` graphql
type Person {
  friends: [Person] @affinity(of: 0.1) @size(mean: 10)
}
```

This means that if we create two people, the chance is 1 in 10 that they will be
friends, but as we create more and more people, the likelihood that some of them
are connected to an existing person grows from a relative unlikelihood into a
near mathematical certainty. As this happens, GraphGen  will end begin re-using
records with increasing frequency until the graph of records converges.


[graphql-list-syntax]: https://graphql.org/learn/schema/#lists-and-non-null
[size]: docs/directives#size
[inverse]: docs/directives#inverse
