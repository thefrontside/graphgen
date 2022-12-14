---
title: Relationships
description: Generating related data
layout: ../../layouts/MainLayout.astro
---

**Generating the shape of your data's network is more important than
generating the shape of each record.**

People have friends. Services have customers. Organizations have
members.  In short, records are related to each other. In fact,
GraphGen actually generates the complete network of relationships
between records _before_ it generates the values for the records themselves.

Like "normal" fields, Relationships are declared in GraphGen are declared using
natural GraphQL syntax. The following illustrates a relationship between people
and the businesses that employ them (assuming a 5% unemployment rate):

``` graphql
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

``` javascript
let person = graphgen.create("Person");
person.employer.name //=> Acme Corp, LLC
```

### One to Many

While the `Person` type in our previous example had a single Employer,
we can also approach the relationhsip from the opposit side. Instead
of A person having an employer, we could also say that an employer
_has many_ employees. We express this using
[GraphQL list syntax][graphql-list-syntax]

``` graphql
type Business {
  employees: [Person]
}

type Person {
  name: String!
}
```

>💡Non-null modifiers do not have any effect on list fields.

Now when you create a Business, it will have a related list of employees:

``` javascript
let business = graphgen.create("Business");
business.employees.length //=> 5
business.employees[0].name //=> Bob Martin
```

#### Controlling the size of relationships

A business with one thousand employees is common-place, but a person
with one thousand children would definitely raise some
eyebrows. There's no one-size-fits-all, which is why GraphGen allows
you to customize how many related records to generate. To do this, it
uses a probabilistic approach. We can use the `@size()` directive to
say that "the average business" has at least 1000 employees, and then
graphgen will select a number of employees that feels right given
those constraints.

``` graphql
type Busines {
  employees: [Person] @size(mean: 1000, min: 1)
}
```

>💡the `@size()` directive can only be applied to lists of related
> types.

Given this information, grahgen will generate for you businesses with 900
employees. Others will have 1200, and still others may have as few as
five, but the majority will be centered around the parameters you set.

For a full description, see the reference for the [`@size`][size]
directive.

[graphql-list-syntax]: https://graphql.org/learn/schema/#lists-and-non-null
[size]: ./directives#size
