/* global describe, it, before */
const windowState = require('../../../../app/common/state/windowState')
const Immutable = require('immutable')
const assert = require('chai').assert
const AssertionError = require('assert').AssertionError

const defaultAppState = Immutable.fromJS({
  tabs: [],
  windows: [],
  otherProp: true
})

const shouldValidateId = function (cb) {
  it('throws an AssertionError if windowId is not a number', function () {
    assert.throws(
      () => {
        cb(null)
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb('b')
      },
      AssertionError
    )
    assert.doesNotThrow(
      () => {
        cb('1')
      },
      AssertionError
    )
  })

  it('throws an AssertionError if windowId < 1', function () {
    assert.throws(
      () => {
        cb(0)
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(-1)
      },
      AssertionError
    )
  })
}

const shouldValidateWindowState = function (cb) {
  it('throws an AssertionError if state does not contain a `windows` array', function () {
    assert.doesNotThrow(
      () => {
        cb(Immutable.fromJS({ windows: [] }))
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(Immutable.Map({}))
      },
      AssertionError
    )
  })

  it('throws an AssertionError if state is not convertable to an Immutable.Map', function () {
    assert.doesNotThrow(
      () => {
        cb({ windows: [] })
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb([])
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb('test')
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(null)
      },
      AssertionError
    )
  })
}

const shouldValidateWindowValue = function (cb) {
  it('throws an AssertionError if `windowValue` does not contain a valid `windowId`', function () {
    assert.doesNotThrow(
      () => {
        cb({ windowId: 1 })
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb({})
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb({ windowId: 'a' })
      },
      AssertionError
    )
  })
}

const shouldValidateAction = function (cb) {
  it('throws an AssertionError if action does not contain a `windowValue` that is convertable to an Immutable.Map', function () {
    assert.doesNotThrow(
      () => {
        cb(Immutable.fromJS({ windowValue: { windowId: 1 } }))
        cb({ windowValue: { windowId: 1 } })
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(Immutable.Map({ blah: {} }))
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(Immutable.Map({}))
      },
      AssertionError
    )
  })

  it('throws an AssertionError if `action` is not convertable to an Immutable.Map', function () {
    assert.doesNotThrow(
      () => {
        cb({ windowValue: { windowId: 1 } })
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb([])
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb('test')
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(null)
      },
      AssertionError
    )
  })
}

describe('windowState', function () {
  describe('getWindowIndexByWindowId', function () {
    before(function () {
      this.appState = defaultAppState.set('windows', Immutable.fromJS([
        { windowId: 2 },
        { windowId: 3 },
        { windowId: 1 }
      ]))
    })

    it('returns the index of the tab for the windowId', function () {
      assert.equal(windowState.getWindowIndexByWindowId(this.appState, 1), 2)
      assert.equal(windowState.getWindowIndexByWindowId(this.appState, 2), 0)
      assert.equal(windowState.getWindowIndexByWindowId(this.appState, 3), 1)
    })

    it('returns -1 if the windowId does not exist', function () {
      assert.equal(windowState.getWindowIndexByWindowId(this.appState, 4), -1)
    })

    shouldValidateId((windowId) => {
      windowState.getWindowIndexByWindowId(defaultAppState, windowId)
    })

    shouldValidateWindowState((state) => {
      windowState.getWindowIndexByWindowId(state, 1)
    })
  })

  describe('getByWindowId', function () {
    before(function () {
      this.appState = defaultAppState.set('windows', Immutable.fromJS([
        { windowId: 1, focused: false },
        { windowId: 2, focused: true }
      ]))
    })

    it('returns the window for `windowId` if it exists', function () {
      let win = windowState.getByWindowId(this.appState, 2)
      assert(win)
      assert.equal(win.get('windowId'), 2)
      assert.equal(win.get('focused'), true)
    })

    it('returns null if the win for `windowId` does not exist', function () {
      let win = windowState.getByWindowId(defaultAppState, 3)
      assert.equal(win, null)
    })

    shouldValidateId((windowId) => {
      windowState.getByWindowId(defaultAppState, windowId)
    })

    shouldValidateWindowState((state) => {
      windowState.getByWindowId(state, 1)
    })
  })

  describe('removeWindowByWindowId', function () {
    before(function () {
      this.appState = defaultAppState.set('windows', Immutable.fromJS([
        { windowId: 1 },
        { windowId: 2 }
      ]))
    })

    it('returns a new immutable state with the window for `windowId` removed if it exists', function () {
      assert.deepEqual(windowState.removeWindowByWindowId(this.appState, 2).get('windows').toJS(), [ {windowId: 1} ])
    })

    it('returns the state unmodified if the window for `windowId` does not exist', function () {
      assert.deepEqual(windowState.removeWindowByWindowId(this.appState, 3).toJS(), this.appState.toJS())
    })

    shouldValidateId((windowId) => {
      windowState.removeWindowByWindowId(defaultAppState, windowId)
    })

    shouldValidateWindowState((state) => {
      windowState.removeWindowByWindowId(state, 1)
    })
  })

  describe('removeWindowByIndex', function () {
    before(function () {
      this.appState = defaultAppState.set('windows', Immutable.fromJS([
        { windowId: 1 },
        { windowId: 2 }
      ]))
    })

    it('returns a new immutable state with the window at `index` removed if it exists', function () {
      assert.deepEqual(windowState.removeWindowByIndex(this.appState, 1).get('windows').toJS(), [ {windowId: 1} ])
    })

    it('returns the state unmodified if `index` is out of bounds', function () {
      assert.deepEqual(windowState.removeWindowByIndex(this.appState, 2).toJS(), this.appState.toJS())
    })

    it('throws an AssertionError if `index` < 0', function () {
      assert.throws(
        () => {
          windowState.removeWindowByIndex(this.appState, -1)
        },
        AssertionError
      )
    })

    it('throws an AssertionError if `index` is not a number', function () {
      assert.throws(
        () => {
          windowState.removeWindowByIndex(this.appState, null)
        },
        AssertionError
      )
      assert.throws(
        () => {
          windowState.removeWindowByIndex(this.appState, 'a')
        },
        AssertionError
      )
      assert.doesNotThrow(
        () => {
          windowState.removeWindowByIndex(this.appState, '1')
        },
        AssertionError
      )
    })

    shouldValidateWindowState((state) => {
      windowState.removeWindowByIndex(state, 1)
    })
  })

  describe('removeWindow', function () {
    before(function () {
      this.appState = defaultAppState.set('windows', Immutable.fromJS([
        { windowId: 1 },
        { windowId: 2 }
      ]))
    })

    it('returns a new immutable state with the window removed by `windowId`', function () {
      assert.deepEqual(
        windowState.removeWindow(this.appState, { windowValue: { windowId: 2 } }).get('windows').toJS(),
        [{ windowId: 1 }])
    })

    shouldValidateAction((action) => {
      windowState.removeWindow(defaultAppState, action)
    })

    shouldValidateWindowValue((windowValue) => {
      windowState.removeWindow(defaultAppState, { windowValue })
    })

    shouldValidateId((windowId) => {
      windowState.removeWindow(defaultAppState, { windowValue: { windowId } })
    })

    shouldValidateWindowState((state) => {
      windowState.removeWindow(state, { windowValue: { windowId: 1 } })
    })
  })

  describe('insertWindow', function () {
    before(function () {
      this.appState = defaultAppState.set('windows', Immutable.fromJS([
        { windowId: 1 }
      ]))
    })

    it('returns a new immutable state with the windowValue appended to the end of the list', function () {
      assert.deepEqual(
        windowState.insertWindow(this.appState, { windowValue: { windowId: 2 } }).get('windows').toJS(),
        [{ windowId: 1 }, { windowId: 2 }])
    })

    it('throws an AssertionError if there is already a tab with the windowId', function () {
      assert.throws(
        () => {
          windowState.insertWindow(this.appState, { windowValue: { windowId: 1 } })
        },
        AssertionError
      )
    })

    shouldValidateAction((action) => {
      windowState.insertWindow(defaultAppState, action)
    })

    shouldValidateWindowValue((windowValue) => {
      windowState.insertWindow(defaultAppState, { windowValue })
    })

    shouldValidateWindowState((state) => {
      windowState.insertWindow(state, { windowValue: { windowId: 1 } })
    })
  })

  describe('updateWindow', function () {
    before(function () {
      this.appState = defaultAppState.set('windows', Immutable.fromJS([
        {
          windowId: 1,
          focused: true,
          myProp: 'test1'
        },
        {
          windowId: 2,
          focused: false
        }
      ]))
    })

    it('returns a new immutable state with the windowValue updated if it already exists', function () {
      assert.deepEqual(
        windowState.updateWindow(this.appState, { windowValue: { windowId: 1, test: 'blue', myProp: 'test2' } }).get('windows').toJS(), [
          {
            windowId: 1,
            myProp: 'test2',
            test: 'blue',
            focused: true
          },
          {
            windowId: 2,
            focused: false
          }
        ])
    })

    it('returns a new immutable state with the windowValue replaced if it already exists and `replace` is true', function () {
      assert.deepEqual(
        windowState.updateWindow(this.appState, { replace: true, windowValue: { windowId: 1, test: 'blue', focused: false } }).get('windows').toJS(), [
          {
            windowId: 1,
            focused: false,
            test: 'blue'
          },
          {
            windowId: 2,
            focused: false
          }
        ])
    })

    it('does not change other values in the appState', function () {
      let state = windowState.updateWindow(this.appState, { windowValue: { windowId: 2, test: 'blue' } })
      assert.deepEqual(state.get('windows').find((win) => win.get('windowId') === 1).toJS(), { focused: true, myProp: 'test1', windowId: 1 })
    })

    shouldValidateAction((action) => {
      windowState.updateWindow(defaultAppState, action)
    })

    shouldValidateWindowValue((windowValue) => {
      windowState.updateWindow(defaultAppState, { windowValue })
    })

    shouldValidateWindowState((state) => {
      windowState.updateWindow(state, { windowValue: { windowId: 1 } })
    })
  })

  describe('getPersistentState', function () {
    before(function () {
      this.windows = Immutable.fromJS([{
        windowId: 1,
        focused: true
      }])
      this.windows = windowState.getPersistentState(this.windows)
    })
  })

  describe('maybeCreateWindow', function () {
    before(function () {
      this.appState = defaultAppState.set('windows', Immutable.fromJS([
        { windowId: 1 }
      ]))
    })

    it('returns a new immutable state with the windowValue appended to the end of the list if it does not already exist', function () {
      assert.deepEqual(
        windowState.maybeCreateWindow(this.appState, { windowValue: { windowId: 2 } }).get('windows').toJS(),
        [{ windowId: 1 }, { windowId: 2 }])
    })

    it('returns a new immutable state with the windowValue updated if it already exists', function () {
      assert.deepEqual(
        windowState.maybeCreateWindow(this.appState, { windowValue: { windowId: 1, test: 'blue' } }).get('windows').toJS(),
        [{ windowId: 1, test: 'blue' }])
    })

    shouldValidateAction((action) => {
      windowState.maybeCreateWindow(defaultAppState, action)
    })

    shouldValidateWindowValue((windowValue) => {
      windowState.maybeCreateWindow(defaultAppState, { windowValue })
    })

    shouldValidateWindowState((state) => {
      windowState.maybeCreateWindow(state, { windowValue: { windowId: 1 } })
    })
  })

  describe('getWindows', function () {
    shouldValidateWindowState((state) => {
      windowState.getWindows(state)
    })
  })
})
