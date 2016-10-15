/* global describe, it */
const suggestion = require('../../../app/renderer/lib/suggestion')
const assert = require('assert')

require('../braveUnit')

const AGE_DECAY = 50

describe('suggestion', function () {
  it('sorts sites correctly', function () {
    assert.ok(suggestion.sortingPriority(10, 100, 50, AGE_DECAY) > suggestion.sortingPriority(10, 100, 40, AGE_DECAY), 'newer sites with equal access counts sort earlier')
    assert.ok(suggestion.sortingPriority(10, 100, 50, AGE_DECAY) < suggestion.sortingPriority(11, 100, 40, AGE_DECAY), 'Sites with higher access counts sort earlier (unless time delay overriden)')
    assert.ok(suggestion.sortingPriority(10, 10000000000, 10000000000, AGE_DECAY) > suggestion.sortingPriority(11, 10000000000, 1000000000, AGE_DECAY), 'much newer sites without lower counts sort with higher priority')
  })
})
