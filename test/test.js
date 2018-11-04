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
      const iter = iterator([2, 4, 6, 7]);
      const test = iter.any(x => x % 2 != 0);
      assert.equal(test, true);
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
      const iter = iterator([2, 4, 6, 7]);
      assert.equal(iter.all(x => x % 2 == 0), false);
      assert.equal(iter.all(x => x > 1), true);
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
  describe('#loop()', () => {
    it('should repeat elements', () => {
      const iter = iterator([1, 2, 3]);
      const looped = iter.loop();
      const sample = looped.take(10).collect();
      assert.deepEqual(sample, [1, 2, 3, 1, 2, 3, 1, 2, 3, 1]);
    });
  });
});
