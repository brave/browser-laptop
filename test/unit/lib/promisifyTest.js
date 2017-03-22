/* global describe, it */

const fs = require('fs')
const promisify = require('../../../js/lib/promisify')
const assert = require('assert')

describe('promisify', function () {
  it('resolves node function from a promise', function * () {
    assert.equal(yield promisify(fs.writeFile, '__test.txt', 'data5')
      .then(() => 42)
      .catch(() => 99), 42)
    fs.unlinkSync('__test.txt')
  })
  it('rejects node function from a promise', function * () {
    assert.equal(yield promisify(fs.writeFile, '///test999.txt', 'data5')
      .then(() => 42)
      .catch(() => 99), 99)
  })
  it('can chain and ignore', function * () {
    assert.equal(yield promisify(fs.writeFile, '__test.txt', 'data5')
      // example of something which will be ignored if there's an error
      .then(() => promisify(fs.rename, '////\\invalid--9test.txt', 'test2.txt').catch(() => {}))
      .then(() => promisify(fs.rename, '__test.txt', '__test2.txt'))
      .then(() => promisify(fs.rename, '__test2.txt', '__test3.txt'))
      .then(() => promisify(fs.rename, '__test3.txt', '__test4.txt'))
      .then(() => 42)
      .catch(() => 99), 42)
    fs.unlinkSync('__test4.txt')
  })
  it('catches errors in between a chain', function * () {
    assert.equal(yield promisify(fs.writeFile, '__test.txt', 'data5')
      // example of something which will be ignored if there's an error
      .then(() => promisify(fs.rename, '////\\invalid--9test.txt', 'test2.txt'))
      .then(() => promisify(fs.rename, '__test.txt', '__test2.txt'))
      .then(() => 42)
      .catch(() => 99), 99)
    fs.unlinkSync('__test.txt')
  })
})
