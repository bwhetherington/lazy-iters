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

class AsyncIterator {
  constructor(iter) {
    this.iter = iter;
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
    return await this.fold(0, (n, _) => n + 1);
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
