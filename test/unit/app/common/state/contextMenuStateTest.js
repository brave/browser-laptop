/* global describe, it */
const Immutable = require('immutable')
const contextMenuState = require('../../../../../app/common/state/contextMenuState.js')
const assert = require('chai').assert

const defaultWindowState = Immutable.fromJS({
  ui: {
    contextMenu: {
      selectedIndex: null
    }
  }
})

describe('contextMenuState', function () {
  describe('selectedIndex', function () {
    it('returns null if selectedIndex is not set', function () {
      const result = contextMenuState.selectedIndex(defaultWindowState)
      assert.equal(result, null)
    })

    it('returns null if selectedIndex is only number', function () {
      const index = 0
      const newState = defaultWindowState.setIn(['ui', 'contextMenu', 'selectedIndex'], index)
      const result = contextMenuState.selectedIndex(newState)
      assert.equal(result, null)
    })

    it('returns array of selected index', function () {
      const index = [0]
      const newState = defaultWindowState.setIn(['ui', 'contextMenu', 'selectedIndex'], index)
      const result = contextMenuState.selectedIndex(newState)
      assert.equal(result, index)
    })
  })
})
