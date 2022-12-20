---
title: Caching
description: |
  Creating large datasets can be computationally expensive. Learn how to cache
  the results while maintaining the appearance that you are creating it from
  scratch every time
---
**Generate large datasets from scratch every time, but not actually**

Realistic datasets can get very large very quickly. This is because
unlike disconnected data, _graphs_ of data are highly interconnected,
and the relationships between records mean that in order to represent
a single record, you may need hundreds of others to stand in for its
relationships, and the relationships of those relationships.

For example, if we want to simulate a modest network of people each of
whom had around 10 friends, we can see how this could end up with a
very large number of people in a very short time.

Conceptually, GraphGen builds each datasets from scratch every time
which allows its API to remain simple. However in practice, if we
forced users to _actually_ generate every data point in a dataset from
scratch every time, it would be exhorbitantly expensive, especially in
the context of something like a test suite where we may want to
generate the same dataset hundreds or thousands of time in a second.

While GraphGen does not provide an explicit mechanism to "save" a
version of a graph so that it can be loaded at some other time, it
does allow you to pass a `storage` option where it will save off
copies of the graph occasionally so that if there is an opportunity to
"fast forward" its generation, it will do that behind the scenes for
you.

Where you decide to store the cache is up to you. All you have to do
is implement the `get()` and `set()` methods of the `Map` api for it
to work.

>💡You can cache in memory, cache on the file system, or cache
> somewher else. However, caching is always optional.

### In-Memory Caching

The simplest form of in-memory cache is just a JavaScript `Map`. This
is appropriate for a something like a test suite where you are willing
to pay the cost of data generation for the first test, but you don't
want to pay it for every subsequent test. Because the cache storage
api is a subset of `Map`, we can just use it directly.

``` javascript
let graphgen = createGraphGen({
  source,
  storage: new Map();
});
```

### File System Caching Example

This is an example of how to use a File system cache with GraphGen. It
is demonstrative rather than authoratative. It uses the `flat-cache`
utility from `npm` and we'll implement the `get()/set()` with it.


```javascript
import flatCache from 'flat-cache';

let cache = flatCache.load("graphgen.cache");

let storage = {
  get(key) {
    return cache.getKey(key);
  },
  set(key, value) {
    cache.setKey(key, value);
    cache.save(true);
    return storage;
  }
}

let graphgen = createGraphGen({
  source,
  storage
});
```
