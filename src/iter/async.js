function isAsyncIterator(obj) {
  return obj != null && typeof obj[Symbol.asyncIterator] === 'function';
}

async function* take(iter, n) {
  let i = 0;
  for await (const x of iter) {
    if (i < n) {
      i++;
      yield x;
    } else {
      break;
    }
  }
}

async function* skip(iter, n) {
  let i = 0;
  for await (const x of iter) {
    i++;
    if (i > n) {
      yield x;
    }
  }
}

async function* map(iter, f) {
  for await (const x of iter) {
    yield f(x);
  }
}

async function* filter(iter, predicate) {
  for await (const x of iter) {
    if (predicate(x)) {
      yield x;
    }
  }
}

async function* use(iter, f) {
  for await (const x of iter) {
    f(x);
    yield x;
  }
}

async function* flatten(iter) {
  for await (const x of iter) {
    if (x instanceof AsyncIterator) {
      for await (const y of x.iter) {
        yield y;
      }
    } else {
      for await (const y of x) {
        yield y;
      }
    }
  }
}

async function* loop(iter) {
  const yielded = [];
  for await (const x of iter) {
    yielded.push(x);
    yield x;
  }
  while (true) {
    yield* yielded;
  }
}

async function* flatMap(iter, f) {
  for await (const x of iter) {
    const innerIter = f(iter);
    if (innerIter instanceof AsyncIterator) {
      yield* innerIter.iter;
    } else {
      yield* innerIter;
    }
  }
}

async function* zip(iterA, iterB) {
  while (true) {
    const a = await iterA.next();
    const b = await iterB.next();
    if (a !== undefined && b !== undefined) {
      yield [a.value, b.value];
    } else {
      break;
    }
  }
}

async function* intersperse(iter, delim) {
  let first = true;
  for await (const x of iter) {
    if (!first) yield delim;
    first = false;
    yield x;
  }
}

async function* enumerate(iter) {
  let n = 0;
  for await (const x of iter) {
    yield [x, n];
    n++;
  }
}

class AsyncIterator {
  constructor(iter) {
    if (isAsyncIterator(iter)) {
      this.iter = iter;
    } else {
      throw new Error(`${iter} is not an async iterator`);
    }
  }

  /**
   * Produces a new iterator where the specified function is executed on each member before
   * yielding it, unmodified.
   * @param {function} f the function to execute on each member
   */
  use(f) {
    return asyncIterator(use(this.iter, f));
  }

  /**
   * Produces a new iterator that yields the first `n` members of this iterator before terminating.
   * @param {number} n the number of members to yield
   */
  take(n) {
    return asyncIterator(take(this.iter, n));
  }

  /**
   * Produces a new iterator equal to this iterator without the first `n` members. If the iterator
   * does not contain `n` or more elements, no elements are yielded by the new iterator.
   * @param {number} n the number of members to skip
   */
  skip(n) {
    return asyncIterator(skip(this.iter, n));
  }

  /**
   * Produces a new iterator where the specified function is executed on each member of the
   * iterator, transforming it.
   * @param {function} f the function to execute on each member
   */
  map(f) {
    return asyncIterator(map(this.iter, f));
  }

  /**
   * Produces a new iterator where the specified function is executed on each member of the
   * iterator, transforming each member into an iterator that is then flattened.
   * @param {function} f the function to execute on each member
   */
  flatMap(f) {
    return asyncIterator(flatMap(this.iter, f));
  }

  /**
   * Produces a new iterator which yields only members of this iterator that, when passed to the
   * specified predicate function, produce `true`.
   * @param {function} predicate the predicate function
   */
  filter(predicate) {
    return asyncIterator(filter(this.iter, predicate));
  }

  /**
   * Performs a right fold across the iterator, starting the specified initial value, and executing
   * the specified reducer function on the current value and each member of the iterator, producing
   * the final result. This is a terminal operation.
   * @param {any} init the initial value
   * @param {function} reducer the specified reducer function
   */
  async fold(init, reducer) {
    let val = init;
    for await (const x of this.iter) {
      val = reducer(val, x);
    }
    return val;
  }

  /**
   * Collects all members of the iterator into a list. This is a terminal operation.
   */
  async collect() {
    const collected = [];
    for await (const x of this.iter) {
      collected.push(x);
    }
    return collected;
  }

  /**
   * Iterates over the iterator, executing the specified function on each member of the iterator.
   * This is a terminal operation.
   * @param {function} f the function to execute on each member
   */
  async forEach(f) {
    for await (const x of this.iter) {
      f(x);
    }
  }

  /**
   * Produces the number of elements in this iterator. This is a terminal operation.
   */
  async count() {
    return await this.map(_ => 1).sum();
  }

  /**
   * Produces the sum of the elements in this iterator. This method should only be used on
   * iterators of numbers. This is a terminal operation.
   */
  async sum() {
    return await this.fold(0, (sum, x) => sum + x);
  }

  /**
   * Converts an iterator of iterators of a type into an iterator of that type. As an example,
   * an iterator structured such as `[[1, 2, 3], [4, 5, 6], [7, 8, 9]]` could be converted into
   * `[1, 2, 3, 4, 5, 6, 7, 8, 9]`.
   */
  flatten() {
    return asyncIterator(flatten(this.iter));
  }

  /**
   * Produces the `n`th member of the iterator. If `n` is outside the bounds of the iterator,
   * `undefined` is returned.
   * @param {number} n the index to take.
   */
  async nth(n) {
    if (n < 0) {
      return undefined;
    } else {
      return await this.skip(n)
        .take(1)
        .collect()[0];
    }
  }

  /**
   * Produces a new iterator that produces the contents of this iterator looped infinitely.
   */
  loop() {
    return asyncIterator(loop(this.iter));
  }

  /**
   * Determines whether or not at least one member of the iterator satisfies the specified
   * predicate. This is a terminal operation.
   * @param {function} predicate the predicate
   */
  async any(predicate) {
    for await (const x of this.iter) {
      if (predicate(x)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determines whether or not all members of the iterator satisfies the specified predicate. This
   * is a terminal operation.
   * @param {function} predicate the predicate
   */
  async all(predicate) {
    for await (const x of this.iter) {
      if (!predicate(x)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Produces a new iterator that yields pairs of elements yielded by each iterators which are
   * stepped in parallel.
   * @param {iterator} iter the other iterator
   */
  zip(iter) {
    if (iter instanceof AsyncIterator) {
      return asyncIterator(zip(this.iter, iter.iter));
    } else {
      return asyncIterator(zip(this.iter, iter));
    }
  }

  /**
   * Produces a new iterator that maps the specified functions over pairs of values yielded
   * simultaneously by this iterator and the specified other iterator.
   * @param {iterator} iter the other iterator
   * @param {function} f the transforming function
   */
  zipWith(iter, f) {
    return this.zip(iter).map(([a, b]) => f(a, b));
  }

  /**
   * Produces the iterator wrapped by this iterator.
   */
  iterator() {
    return this.iter;
  }

  /**
   * Produces the first element of this iterator, or `undefined` if it yields nothing. This is a
   * terminal operation.
   */
  async first() {
    for await (const x of this.iter) {
      return x;
    }
    return undefined;
  }

  /**
   * Intersperses elements of the iterator with the specified delimiter.
   * @param {any} delim the interspersing delimiter
   */
  intersperse(delim) {
    return asyncIterator(intersperse(this.iter, delim));
  }

  /**
   * Produces an iterator where each element consists of a list of size 2. The
   * first element of the list is the corresponding element of the initial
   * iterator, and the second element of the list is the index of the element.
   */
  enumerate() {
    return asyncIterator(enumerate(this.iter));
  }
}

/**
 * Produces an `AsyncIterator` wrapping the specified asynchronous iterator. The asynchronous
 * iterator interface is identical to that of synchronous iterators, however all terminal
 * operations are `async`.
 * @param {asyncIterator} iter the asynchronous iterator to wrap
 */
function asyncIterator(iter) {
  return new AsyncIterator(iter);
}

module.exports = asyncIterator;
