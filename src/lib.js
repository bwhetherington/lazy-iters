const asyncIterator = require('./iter/async');
const iterator = require('./iter/sync');

function* positives() {
  for (let i = 1; true; i++) {
    yield i;
  }
}

function* negatives() {
  for (let i = -1; true; i--) {
    yield i;
  }
}

module.exports = {
  asyncIterator,
  iterator,
  positives,
  negatives
};
