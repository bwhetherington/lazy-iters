function* take(iter, n) {
  let i = 0;
  for (const x of iter) {
    if (i < n) {
      i++;
      yield x;
    } else {
      break;
    }
  }
}

function* skip(iter, n) {
  let i = 0;
  for (const x of iter) {
    if (i >= n) {
      i++;
      yield x;
    }
  }
}

function* map(iter, f) {
  for (const x of iter) {
    yield f(x);
  }
}

function* filter(iter, predicate) {
  for (const x of iter) {
    if (predicate(x)) {
      yield x;
    }
  }
}

function* use(iter, f) {
  for (const x of iter) {
    f(x);
    yield x;
  }
}

class Iterator {
  constructor(iter) {
    this.iter = iter;
  }

  /**
   * Produces a new iterator where the specified function is executed on each member before
   * yielding it, unmodified.
   * @param {function} f the function to execute on each member
   */
  use(f) {
    return iterator(use(this.iter, f));
  }

  /**
   * Produces a new iterator that yields the first `n` members of this iterator before terminating.
   * @param {number} n the number of members to yield
   */
  take(n) {
    return iterator(take(this.iter, n));
  }

  /**
   * Produces a new iterator equal to this iterator without the first `n` members. If the iterator
   * does not contain `n` or more elements, no elements are yielded by the new iterator.
   * @param {number} n the number of members to skip
   */
  skip(n) {
    return iterator(skip(this.iter, n));
  }

  /**
   * Produces a new iterator where the specified function is executed on each member of the
   * iterator, transforming it.
   * @param {function} f the function to execute on each member
   */
  map(f) {
    return iterator(map(this.iter, f));
  }

  /**
   * Produces a new iterator which yields only members of this iterator that, when passed to the
   * specified predicate function, produce `true`.
   * @param {func} predicate the predicate function
   */
  filter(predicate) {
    return iterator(filter(this.iter, predicate));
  }

  /**
   * Performs a right fold across the iterator, starting the specified initial value, and executing
   * the specified reducer function on the current value and each member of the iterator, producing
   * the final result. This is a terminal operation.
   * @param {any} init the initial value
   * @param {function} reducer the specified reducer function
   */
  fold(init, reducer) {
    let val = init;
    for (const x of this.iter) {
      val = reducer(val, x);
    }
    return val;
  }

  /**
   * Collects all members of the iterator into a list. This is a terminal operation.
   */
  collect() {
    const collected = [];
    for (const x of this.iter) {
      collected.push(x);
    }
    return collected;
  }

  /**
   * Iterates over the iterator, executing the specified function on each member of the iterator.
   * This is a terminal operation.
   * @param {function} f the function to execute on each member
   */
  forEach(f) {
    for (const x of this.iter) {
      f(x);
    }
  }

  /**
   * Produces the number of elements in this iterator. This is a terminal operation.
   */
  count() {
    return this.map(_ => 1).sum();
  }

  /**
   * Produces the sum of the elements in this iterator. This method should only be used on
   * iterators of numbers. This is a terminal operation.
   */
  sum() {
    return this.fold(0, (sum, x) => sum + x);
  }
}

/**
 * Produces an `Iterator` wrapping the specified iterator.
 * @param {iterator} iter the iterator to wrap
 */
function iterator(iter) {
  return new Iterator(iter);
}

module.exports = iterator;
