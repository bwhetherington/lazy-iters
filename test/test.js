const assert = require('assert');
const { asyncIterator, iterator } = require('../src/lib');

describe('iterator', () => {
  describe('#collect()', () => {
    it('should return [] when the iterator yields nothing', () => {
      function* generator() {}
      const iter = iterator(generator());
      assert.deepEqual(iter.collect(), []);
    });
    it('should collect all yielded elements', () => {
      const iter = iterator([1, 2, 3]);
      assert.deepEqual(iter.collect(), [1, 2, 3]);
    });
  });
  describe('#take(n)', () => {
    it('should not exceed the number of yielded elements', () => {
      const iter = iterator([1, 2, 3]);
      const sample = iter.take(10).collect();
      assert.deepEqual(sample, [1, 2, 3]);
    });
    it('should work for infinite generators', () => {
      function* infinite() {
        for (let i = 0; true; i++) {
          yield i;
        }
      }

      const iter = iterator(infinite());
      const sample = iter.take(5).collect();
      assert.deepEqual(sample, [0, 1, 2, 3, 4]);
    });
  });
  describe('#skip(n)', () => {
    it('should yield nothing if the whole iterator or more is skipped', () => {
      const iter = iterator([1, 2, 3, 4, 5]);
      const sample = iter.skip(6).collect();
      assert.deepEqual(sample, []);
    });
    it('should skip the first n elements', () => {
      const iter = iterator([1, 2, 3, 4, 5]);
      const sample = iter.skip(2).collect();
      assert.deepEqual(sample, [3, 4, 5]);
    });
  });
  describe('#any()', () => {
    it('should return false for an empty iterator', () => {
      const iter = iterator([]);
      assert.equal(iter.any(_ => true), false);
    });
    it('should test all elements', () => {
      const iter = iterator([2, 4, 6]);
      const test = iter.any(x => x % 2 != 0);
      assert.equal(test, false);
    });
    it('should short circuit', () => {
      let numTested = 0;
      const iter = iterator([3, 4, 5, 6, 7]);
      iter
        .use(_ => {
          numTested++;
        })
        .any(x => x % 2 == 0);
      assert.equal(numTested, 2);
    });
  });
  describe('#all()', () => {
    it('should return true for an empty iterator', () => {
      const iter = iterator([]);
      assert.equal(iter.all(_ => false), true);
    });
    it('should test all elements', () => {
      const iter = iterator([2, 4, 6]);
      assert.equal(iter.all(x => x % 2 == 0), true);
    });
    it('should short circuit', () => {
      let numTested = 0;
      const iter = iterator([2, 3, 4, 5]);
      iter
        .use(_ => {
          numTested++;
        })
        .all(x => x % 2 == 0);
      assert.equal(numTested, 2);
    });
  });
  describe('#map(f)', () => {
    it('should map a function to each element of the iterator', () => {
      const iter = iterator([1, 2, 3, 4, 5]);
      const mapped = iter.map(x => x * x).collect();
      assert.deepEqual(mapped, [1, 4, 9, 16, 25]);
    });
  });
  describe('#filter(predicate)', () => {
    it('should filter elements of the iterator', () => {
      const iter = iterator([1, 2, 3, 4, 5]);
      const filtered = iter.filter(x => x % 2 == 0).collect();
      assert.deepEqual(filtered, [2, 4]);
    });
  });
  describe('#fold(init, reducer)', () => {
    it('should fold right across the iterator', () => {
      const iter = iterator([1, 2, 3]);
      const folded = iter.fold(0, (sum, x) => sum + x);
      assert.deepEqual(folded, 6);
    });
  });
  describe('#sum()', () => {
    it('should return 0 if no elements are yielded', () => {
      const iter = iterator([]);
      const sum = iter.sum();
      assert.equal(sum, 0);
    });
    it('should add elements of the iterator', () => {
      const iter = iterator([1, 2, 3]);
      const sum = iter.sum();
      assert.equal(sum, 6);
    });
  });
  describe('#count()', () => {
    it('should count elements in the iterator', () => {
      const iter = iterator([1, 2, 3]);
      const count = iter.count();
      assert.equal(count, 3);
    });
  });
  describe('#flatten()', () => {
    it('should flatten inner iterators', () => {
      const iter = iterator([[1, 2, 3], [4, 5, 6]]);
      const flattened = iter.flatten().collect();
      assert.deepEqual(flattened, [1, 2, 3, 4, 5, 6]);
    });
    it('should flatten inner lazy iterators', () => {
      const iter1 = iterator([1, 2, 3]);
      const iter2 = iterator([4, 5, 6]);
      const iter = iterator([iter1, iter2]);
      const flattened = iter.flatten().collect();
      assert.deepEqual(flattened, [1, 2, 3, 4, 5, 6]);
    });
  });
  describe('#loop()', () => {
    it('should repeat elements', () => {
      const iter = iterator([1, 2, 3]);
      const looped = iter.loop();
      const sample = looped.take(10).collect();
      assert.deepEqual(sample, [1, 2, 3, 1, 2, 3, 1, 2, 3, 1]);
    });
  });
  describe('#forEach(f)', () => {
    it('should execute for each member of the iterator', () => {
      let i = 0;
      const iter = iterator([1, 2, 3]);
      iter.forEach(_ => i++);
      assert.equal(i, 3);
    });
  });
  describe('#use(f)', () => {
    it('should not execute before a terminal operation', () => {
      let i = 0;
      const iter = iterator([1, 2, 3]);
      iter.use(_ => i++);
      assert.equal(i, 0);
    });
    it('should execute after a terminal operation', () => {
      let i = 0;
      const iter = iterator([1, 2, 3]);
      iter.use(_ => i++).collect();
      assert.equal(i, 3);
    });
  });
});
