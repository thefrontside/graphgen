---
title: Generation Method Dispatch
description: |
  How to be smart about which fields get which data
---

**GraphGen makes it easy to create good data by default**

In the section introducing fields, we [touched very
briefly][fields-generators] on attaching custom generation methods to
fields by using the `@gen` directive.  It is important to know how
this works, but it would not be great if in order to do describe your
generation you had to attach a `@gen` directive to every single field
in your entire schema. Fortunately, GraphGen allows you to paint with
a much larger brush. In this section, we'll show how you can
effeciently write "generation middleware" to quickly match against
hundreds of fields at a time so you don't have to specify each one
individually.

If you don't want to learn about the nitty gritty, but intsead learn
how to use it to accomplish most of what you need, you can skip ahead
to the section describing the [full integration with faker][faker]

### Generation Middlewares

Let's have another look at our example from the [section on fields][fields]. We
created our GraphGen with a `generator` function that receives information about
what needs to be generated, and then make a decision about what to do with it:

```javascript
import { faker } from "@faker-js/faker";

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
  },
});
```

It is implemented as a switch statement which checks first if this is
a case we want to handle. If it is, then we handle it, otherwise, we
"pass it off" to the other generators further down the line.

If the template for this logic seems familiar, it is probably because
it is based on the concept of ["middleware"][middleware] so prevalent
on the HTTP stack.

### Reference

[fields-generators]: docs/basics/fields#custom-generators
[faker]: docs/usage/faker
[fields]: docs/basics/fields
[middleware]: https://www.moesif.com/blog/engineering/middleware/What-Is-HTTP-Middleware/
