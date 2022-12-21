---
title: Directives
description: |
  a complete reference of the GraphQL directives used to control data
  generation
---

This is a reference of all the GraphQL directives that can be used to direct how
data is generated with GraphGen. They are attached to an associated field, and
modify and inform the way in which GraphGen will generate it.

##  @has(chance: _Float!_)

Used to indicate what the probability is that a record will have a related
record. Only applicable to fields which represent relationships. The type of the
field must be nullable.

### options

* `chance`: A number between number 0 and 1 indicating the probability
that a related record exists. `[default:0.5]`

### example

``` graphql
type Person {
  employer: Business @has(chance: 0.9)
}
```

##  @gen(with: _String!_ args: _[String|Float|Int|Boolean]_)

Every field has a [generation method][dispatch]. This directive explicitly sets
the name of that method.

### options

* `with`: a string identifying the generation method. It can be any unique
string
* `args`: arguments that will be passed to the generation method that is
registerd with factory.

### Examples

``` graphql
# use a generation method
type Person {
  name: String! @gen("@human/name")
}
```

``` graphql
# pass arguments to the generation method
# the meaning of the arguments are up to the method itself
type Person {
  name: String! @gen("names", args: ["type", "human"])
}
```

### Notes

If an explicit generation method is not specified, it will default to
the typename concatenated with the field name. E.g. `Person.name`


##  @computed
Mark a field as being derived from the record data and not generated.
The implemenation of the [computed][] field must be provided to
`createGraphgen()`.

### Examples

``` graphql
type Person {
  firstName: String!
  lastName: String!
  fullName: String! @computed
```


##  @size(mean: _Int_, min: _Int_, max: _Int_, standardDeviation: _Int_)
Describe the [noraml distribution][normal-distribution] that governs
how many related records will be generated. Only applicable to list fields.

* `mean`: the average number of related records. `[default:5]`
* `standardDeviation`: the [standard deviation][standard-deviation] of the
number of related records. A small number will mean that the size clusters close
to the `mean`, but a larger value causes samples to be scattered farther from
the average. `[default:1]`
* `min`: the number of related records will always be greater than
  this number. Must be greater than or equal to zero. `[default:0]`
* `max`: the number of related records will never be greater than this
  number. `[default:Infinity]`

### Examples

```graphql
type Person {
  employees: [Person] @size(mean: 100, standardDeviation: 10, min: 1)
}
```

##  @inverse(of: _String!_)
Marks a relationship as being the other side of another
relationship. The other side of the relationship is named with the
concatenation of the `typename` and `fieldname`. This allows GraphGen
to generate related records but still maintain [referential
integrity][referential-integrity]. It must reference a relationship
that existis by its fully qualified name. This can be attached to both normal
and list fields, so long as the type is a record type.

* `of`: The name of the inverse relationship in `typename.fieldname` format.
E.g. `Person.employer`

### Examples

``` graphql
type Person {
  employer: Business! @inverse(of: "Business.employees")
}

type Busines {
  employees: [Person]
}
```

##  @affinity(of: _Float!_)
A number between `0` and `1` indicating the probability that any two
records of a given type are related via the relationship expressed by
the associated field. When generating related records, graphgen will
use this probability to determine whether to create a new record, or
to point a relationship to an existing record. Specifically, as the
population of related types increases, you begin to create fewer and
fewer new records in order to satisfy the affinity constraint.

An affinity of zero means that a new record will _always_ be created,
whereas an affinity of one indicates that an an existing record will
_always_ be used except in the event that there is not yet one
existing record already.

Use affinity to make graph generation converge rather than exploding into
infinity.

* `of`: probability that two records of the given type are
  related. Must a number between `0` and `1`.

### Examples

``` graphql
# the probability that any two people are friesds is 5%
type Person {
  friends: [Person] @affinity(of: 0.05)
}
```

[dispatch]: docs/usage/dispatch
[computed]: docs/basics/computed
[normal-distribution]: https://en.wikipedia.org/wiki/Normal_distribution
[standard-deviation]: https://en.wikipedia.org/wiki/Standard_deviation
[referential-integrity]: docs/basics/relationships#referential-integrity
