/* global describe, before, it */

const localSearchHistoryState = require('../../../app/common/state/localSearchHistoryState')
const assert = require('assert')
const Immutable = require('immutable')

describe('localSearchHistory', function () {
  before(function () {})
  it('build a search term entry', function () {
    var entry = localSearchHistoryState.buildEntry('search term')
    assert.ok(entry.searchTerm === 'search term', 'search term stored')
    assert.ok(entry.ts > 0, 'timestamp recorded')
  })
  it('clear history', function () {
    var history = localSearchHistoryState.clear()
    assert.ok(history.size === 0, 'history cleared')
  })
  it('adds a new entry', function () {
    var history = localSearchHistoryState.clear()
    var entry1 = Immutable.Map({ searchTerm: 'search term' })
    history = localSearchHistoryState.update(history, entry1)
    assert.ok(history.size === 1, 'one entry added to history')
    var entry2 = Immutable.Map({ searchTerm: 'search term' })
    history = localSearchHistoryState.update(history, entry2)
    assert.ok(history.size === 1, 'one entry updated in history')
  })
})
