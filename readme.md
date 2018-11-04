# `lazy-iters`

The `lazy-iters` package provides a common interface for iterators. It provides common intermediate operations, such as `map` and `filter` which are only evaluated after calling a terminal operation. These same methods are also offered for asynchronous iterators. The only difference is that all terminal operations for asynchronous generators are themselves asynchronous.

This interface was inspired in large part by Rust's `Iterator` trait.

## Examples

```javascript
import { iterator } from "lazy-iters";

// Create anything that can be iterated over using for ... of.
const list = [1, 2, 3, 4, 5];

// Convert it into a lazy iterator and chain methods on it.
const odds = iterator(list)
  .filter(x => x % 2 != 0)
  .collect();

// You can also do whatever else you want with it.
const sumOfSquaredEvens = iterator(list)
  .filter(x => x % 2 == 0)
  .map(x => x * x)
  .sum();
```

In addition, asynchronous iterators are also offered:

```javascript
import { asyncIterator } from "lazy-iters";

/**
 * Sleeps for `ms` milliseconds.
 * @param {number} ms the number of milliseconds to sleep for
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a number every 1 second.
 */
async function* asyncGenerator() {
  let i = 0;
  while (true) {
    yield i;
    await sleep(1000);
  }
}

async function doSomething() {
  const generator = asyncGenerator();
  const sumOfFirst10Evens = await asyncIterator(generator)
    .filter(x => x % 2 == 0)
    .take(10)
    .sum();
}
```
