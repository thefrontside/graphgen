---
title: Presets
description: |
  Overriding the random values with precise values that can be used every time.
---

**When you need to have an exact data point, GraphGen has got your back**

Sometimes you don'w want a random value, even one which is very realistic.
Instead you want a fixed data point that you can rely on being present. Usually
this happens when you are writing a test case and you want to make an
assertian against a value that you know think of ahead of time. In
GraphGen, you can accomplish with _presets_. These are values you pass
in when you create a record that will be used wholesale. For example,
let's say we have a `Person` type:

``` graphql
type Person {
  name: String!
}
```

If we just call `graphgen.create('Person')` it will generate a new
person record with a random value for `name`. Howover, if we pass in a
set of properties along with the type of record that we want to
create, then those properties will override any generated or computed
properties of the record. So for example, we can set the name of a
person explicitly, and that is the value that GraphGen will use.

``` javascript
let person = graphgen.create("Person", {
  name: "Bob Dobalina"
});

person.name //=> "Bob Dobalina"
```

Presets can be used not only for normal properties, but also for
relationships. Consider the following schema:

``` graphql

type Person {
  name: String!
  employer: Business @has(chance: 0.95)
}

type Business {
  name: String!
  employees: [Person] @inverse(of: "Person.employer") @size(mean: 10)
}
```

Suppose we want to create a test case in which we want to check that
our API returns a certain Bob Dobalina that works for for Acme
Corp. We can do this by passing in preset properties for the
relationship as well:

``` javascript
let person = graphgen.create("Person", {
  name: "Bob Dobalina",
  employer: {
    name: "Acme, Corp",
  }
});

person.name //=> Bob Dobalina
person.employer.name //=> Acme, Corp
```

GraphGen will use the preset values for _both_ of the records that it
ends up creating.

### Preset Collections

What happens when you generating from the side of a relationship that
has a collection? In this case, what if we generated a Business name
Acme Corp and we wanted to ensure that one of the employees was named
Bob Dobalina? To do this, pass an array containing the values that you
want to be present:

``` javascript
let business = graphgen.create("Business", {
  name: "Acme, Corp"
  employees: [
    { name: "Bob Dobalina" }
  ]
});
business.name //=> Acme, Corp
!!business.employees.find(e => e.name === 'Bob Dobalina') //=> true
```

This says in effect, "the list of employees must contain one whose
name is Bob Dobalina". Note that when you preset the members of a collection
like this, the list you pass in is not exhaustive. GraphGen will still
generate other employees for you so that it satisfies the `@size()`
directive on the `Business.employees` collection. The only difference
is that one of those employees is guaranteed to have the desired
preset values.

### Preset Priority

Preset values will always pre-empt generated values, even in the case
where chance dictates that no relationship should be present, or that
the size of a collection will be zero. For example, if we have a very
low probability of 10% that a person is employed:

``` graphql
type Person {
  employeer: Business @has(chance: 0.10)
}
```

Generating a person with an employer will preset will _always_ create
an employer for that person.

By the same token if the `@size()` of a collection is smaller than the
number of presets, the resulting value will still contain all of the
presets. If we average the number of a Business's employees to be very
small:

``` graphql
type Business {
  employees: [Person] @size(mean: 1)
}
```

But we generate it with three empty presets:

``` javascript
let business = graphgen.create("Business", {
  employees: [{},{},{}]
});
```

Then the resulting business will _always_ have at least three employees.
