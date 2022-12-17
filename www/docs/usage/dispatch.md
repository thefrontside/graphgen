---
title: Generation Method Dispatch
description: |
  How to be smart about which fields get which data
---

**GraphGen makes it easy to create good data by default**

In the section introducing fields, we [touched very briefly][fields] on
attaching custom generation methods to fields by using the `@gen` directive.
It is mportant to know how this works, but in practice you paint GraphGen
with a much larger brush. In this section, we'll show how you can effeciently
write "generation middleware" to quickly match against hundreds of fields.

If you don't want to learn about the nitty gritty, but intsead learn how to use
it to accomplish most of what you need, you can skip ahead to the section
describing the [full integration with faker][faker]

[fields]: docs/basics/fields#custom-generators
[faker]: docs/usage/faker
