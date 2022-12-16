---
title: Computed Properties
description: |
  Some data is not generated at all, but is entirely dependent on the the data
  that is
---
**Generate as little data as possible, derive the rest**

Realistic looking data is not random. If my name is Phineas
Brownstone, employee of Acme Corp, then it would be very unlikely that
my work email address would be "alison.feerskin@randalls.net" For
these cases where realistic data can be derived from the generated
data, GraphGen supports the idea of "computed" properties. These are
functions which calculate the value of a property based on an existing
property. To use them, you firt mark a field as being "computed", and
then you provide the implementation with your factory. For example,
let's add an email to our Business/Employee relationship and mark it
as computed.

```graphql
type Person {
  email: String@ @computed
  employer: Business @has(chance: .95)
}

type Business {
  name: String! @gen(with: "faker.business.name")
  domain: String! @gen(with: "faker.internet.domainName")
}

```

Once GraphGen knows that the email is computed, then we can tell it
how to compute it. we do this by passing a list of property names to
functions that define how to get the email. If a person has an
employer, it will use that business's domain. Otherwise, it will use "gmail.com"

``` javascript
let graphgen = createGraphGen({
  compute: {
    "Person.email": person => {
      let username = person.name.toLowerCase().replace(/\s+/, '.');
      let domain = person.employer ? person.employer.domain : "gmail.com";
      return `${username}@${domain}`;
    }
  }
});

let person = graphgen.create("Person");
person.email //=> "phineas.barnstone@acme.com";
```
