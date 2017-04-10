/* global describe, it, before, after */
const tabState = require('../../../../../app/common/state/tabState')
const Immutable = require('immutable')
const sinon = require('sinon')
const assert = require('chai').assert
const AssertionError = require('assert').AssertionError

const defaultAppState = Immutable.fromJS({
  tabs: [],
  windows: [],
  otherProp: true
})

const defaultWindowState = Immutable.fromJS({
  frames: []
})

const shouldValidateId = function (cb) {
  it('throws an AssertionError if tabId is not a number', function () {
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

  it('throws an AssertionError if tabId < 1 and !== -1', function () {
    assert.throws(
      () => {
        cb(0)
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(-2)
      },
      AssertionError
    )
    assert.doesNotThrow(
      () => {
        cb(-1)
      },
      AssertionError
    )
  })
}

const shouldValidateTabState = function (cb) {
  it('throws an AssertionError if state does not contain a `tabs` array', function () {
    assert.doesNotThrow(
      () => {
        cb(Immutable.fromJS({ tabs: [] }))
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
        cb({ tabs: [] })
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

const shouldValidateTabValue = function (cb) {
  it('throws an AssertionError if `tabValue` does not contain a valid `tabId`', function () {
    assert.doesNotThrow(
      () => {
        cb({ tabId: 1 })
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
        cb({ tabId: 'a' })
      },
      AssertionError
    )
  })
}

const shouldValidateAction = function (cb) {
  it('throws an AssertionError if action does not contain a `tabValue` that is convertable to an Immutable.Map', function () {
    assert.doesNotThrow(
      () => {
        cb(Immutable.fromJS({ tabValue: { tabId: 1 } }))
        cb({ tabValue: { tabId: 1 } })
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
        cb({ tabValue: { tabId: 1 } })
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

describe('tabState unit tests', function () {
  describe('getTabIndexByTabId', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 2 },
        { tabId: 3 },
        { tabId: 1 }
      ]))
    })

    it('returns the index of the tab for the tabId', function () {
      assert.equal(tabState.getTabIndexByTabId(this.appState, 1), 2)
      assert.equal(tabState.getTabIndexByTabId(this.appState, 2), 0)
      assert.equal(tabState.getTabIndexByTabId(this.appState, 3), 1)
    })

    it('returns -1 if the tabId does not exist', function () {
      assert.equal(tabState.getTabIndexByTabId(this.appState, 4), -1)
    })

    shouldValidateId((tabId) => {
      tabState.getTabIndexByTabId(defaultAppState, tabId)
    })

    shouldValidateTabState((state) => {
      tabState.getTabIndexByTabId(state, 1)
    })
  })

  describe('getByTabId', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        {
          windowId: 1,
          frameKey: 1,
          tabId: 2
        },
        {
          windowId: 1,
          frameKey: 2,
          tabId: 1
        }
      ]))
    })

    it('returns the tab for `tabId` if it exists', function () {
      let tab = tabState.getByTabId(this.appState, 2)
      assert(tab)
      assert.equal(1, tab.get('windowId'))
      assert.equal(1, tab.get('frameKey'))
      assert.equal(2, tab.get('tabId'))
    })

    it('returns null if the tab for `tabId` does not exist', function () {
      let tab = tabState.getByTabId(defaultAppState, 3)
      assert.equal(null, tab)
    })

    shouldValidateId((tabId) => {
      tabState.getByTabId(defaultAppState, tabId)
    })

    shouldValidateTabState((state) => {
      tabState.getByTabId(state, 1)
    })
  })

  describe('removeTabByTabId', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1 },
        { tabId: 2 }
      ]))
    })

    it('returns a new immutable state with the tab for `tabId` removed if it exists', function () {
      assert.deepEqual(tabState.removeTabByTabId(this.appState, 2).get('tabs').toJS(), [ {tabId: 1} ])
    })

    it('returns the state unmodified if the tab for `tabId` does not exist', function () {
      assert.deepEqual(tabState.removeTabByTabId(this.appState, 3).toJS(), this.appState.toJS())
    })

    shouldValidateId((tabId) => {
      tabState.removeTabByTabId(defaultAppState, tabId)
    })

    shouldValidateTabState((state) => {
      tabState.removeTabByTabId(state, 1)
    })
  })

  describe('removeTabByIndex', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1 },
        { tabId: 2 }
      ]))
    })

    it('returns a new immutable state with the tab at `index` removed if it exists', function () {
      assert.deepEqual(tabState.removeTabByIndex(this.appState, 1).get('tabs').toJS(), [ {tabId: 1} ])
    })

    it('returns the state unmodified if `index` is out of bounds', function () {
      assert.deepEqual(tabState.removeTabByIndex(this.appState, 2).toJS(), this.appState.toJS())
    })

    it('throws an AssertionError if `index` < 0', function () {
      assert.throws(
        () => {
          tabState.removeTabByIndex(this.appState, -1)
        },
        AssertionError
      )
    })

    it('throws an AssertionError if `index` is not a number', function () {
      assert.throws(
        () => {
          tabState.removeTabByIndex(this.appState, null)
        },
        AssertionError
      )
      assert.throws(
        () => {
          tabState.removeTabByIndex(this.appState, 'a')
        },
        AssertionError
      )
      assert.doesNotThrow(
        () => {
          tabState.removeTabByIndex(this.appState, '1')
        },
        AssertionError
      )
    })

    shouldValidateTabState((state) => {
      tabState.removeTabByIndex(state, 1)
    })
  })

  describe('removeTab', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1 },
        { tabId: 2 }
      ]))
    })

    it('returns a new immutable state with the tab removed by `tabId`', function () {
      assert.deepEqual(
        tabState.removeTab(this.appState, { tabValue: { tabId: 2 } }).get('tabs').toJS(),
        [{ tabId: 1 }])
    })

    shouldValidateAction((action) => {
      tabState.removeTab(defaultAppState, action)
    })

    shouldValidateTabValue((tabValue) => {
      tabState.removeTab(defaultAppState, { tabValue })
    })

    shouldValidateId((tabId) => {
      tabState.removeTab(defaultAppState, { tabValue: { tabId } })
    })

    shouldValidateTabState((state) => {
      tabState.removeTab(state, { tabValue: { tabId: 1 } })
    })
  })

  describe('insertTab', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1 }
      ]))
    })

    it('returns a new immutable state with the tabValue appended to the end of the list', function () {
      assert.deepEqual(
        tabState.insertTab(this.appState, { tabValue: { tabId: 2 } }).get('tabs').toJS(),
        [{ tabId: 1 }, { tabId: 2 }])
    })

    it('throws an AssertionError if there is already a tab with the tabId', function () {
      assert.throws(
        () => {
          tabState.insertTab(this.appState, { tabValue: { tabId: 1 } })
        },
        AssertionError
      )
    })

    shouldValidateAction((action) => {
      tabState.insertTab(defaultAppState, action)
    })

    shouldValidateTabValue((tabValue) => {
      tabState.insertTab(defaultAppState, { tabValue })
    })

    shouldValidateTabState((state) => {
      tabState.insertTab(state, { tabValue: { tabId: 1 } })
    })
  })

  describe('updateTab', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        {
          windowId: 1,
          frameKey: 1,
          tabId: 1,
          myProp: 'test1',
          myProp2: 'blah'
        },
        {
          windowId: 1,
          frameKey: 1,
          tabId: 2,
          myProp: 'test2',
          myProp2: 'blah'
        }
      ]))
    })

    it('returns a new immutable state with the tabValue updated if it already exists', function () {
      assert.deepEqual(
        tabState.updateTab(this.appState, { tabValue: { tabId: 1, test: 'blue', myProp: 'test2' } }).get('tabs').toJS(), [
          {
            tabId: 1,
            test: 'blue',
            windowId: 1,
            frameKey: 1,
            myProp: 'test2',
            myProp2: 'blah'
          },
          {
            windowId: 1,
            frameKey: 1,
            tabId: 2,
            myProp: 'test2',
            myProp2: 'blah'
          }
        ])
    })

    it('returns a new immutable state with the tabValue replaced if it already exists and `replace` is true', function () {
      assert.deepEqual(
        tabState.updateTab(this.appState, { replace: true, tabValue: { tabId: 1, test: 'blue', myProp: 'test2' } }).get('tabs').toJS(), [
          {
            tabId: 1,
            test: 'blue',
            myProp: 'test2'
          },
          {
            windowId: 1,
            frameKey: 1,
            tabId: 2,
            myProp: 'test2',
            myProp2: 'blah'
          }
        ])
    })

    it('does not change other values in the appState', function () {
      let state = tabState.updateTab(this.appState, { tabValue: { tabId: 2, test: 'blue' } })
      let tab = state.get('tabs').find((tab) => tab.get('tabId') === 1)
      assert(tab)
      assert.equal('test1', tab.get('myProp'))
      assert.equal('blah', tab.get('myProp2'))
      assert.equal(1, tab.get('windowId'))
      assert.equal(1, tab.get('frameKey'))
      assert.equal(1, tab.get('tabId'))
      assert.equal(true, state.get('otherProp'))
    })

    shouldValidateAction((action) => {
      tabState.updateTab(defaultAppState, action)
    })

    shouldValidateTabValue((tabValue) => {
      tabState.updateTab(defaultAppState, { tabValue })
    })

    shouldValidateTabState((state) => {
      tabState.updateTab(state, { tabValue: { tabId: 1 } })
    })
  })

  describe('removeTabField', function () {
    it('removes the field specified', function () {
      const tab = Immutable.fromJS({
        windowId: 1,
        frameKey: 1,
        tabId: 2,
        loginRequiredDetail: {
          request: { url: 'someurl' },
          authInfo: { authInfoProp: 'value' }
        }
      })
      const tabs = Immutable.fromJS([tab])
      const tabsWithoutField = Immutable.fromJS([tab.delete('loginRequiredDetail')])
      const newAppState = tabState.removeTabField(defaultAppState.set('tabs', tabs), 'loginRequiredDetail')
      const expectedAppState = defaultAppState.set('tabs', tabsWithoutField)
      assert.deepEqual(newAppState, expectedAppState)
    })
    it('returns the state (unchanged) if tabs is falsey', function () {
      const emptyTabState = defaultAppState.delete('tabs')
      const newAppState = tabState.removeTabField(emptyTabState, 'loginRequiredDetail')
      assert.equal(newAppState, emptyTabState)
    })
  })

  describe('getPersistentState', function () {
    let appState
    let removeTabFieldSpy

    before(function () {
      const tabs = Immutable.fromJS([{
        windowId: 1,
        frameKey: 1,
        tabId: 2,
        loginRequiredDetail: {
          request: { url: 'someurl' },
          authInfo: { authInfoProp: 'value' }
        }
      }])
      appState = defaultAppState.set('tabs', tabs)
      removeTabFieldSpy = sinon.spy(tabState, 'removeTabField')
      tabState.getPersistentState(appState)
    })

    after(function () {
      removeTabFieldSpy.restore()
    })

    it('removes message box data', function () {
      assert.equal(removeTabFieldSpy.withArgs(appState, 'messageBoxDetail').calledOnce, true)
    })
  })

  describe('maybeCreateTab', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1 }
      ]))
    })

    it('returns a new immutable state with the tabValue appended to the end of the list if it does not already exist', function () {
      assert.deepEqual(
        tabState.maybeCreateTab(this.appState, { tabValue: { tabId: 2 } }).get('tabs').toJS(),
        [{ tabId: 1 }, { tabId: 2 }])
    })

    it('returns a new immutable state with the tabValue updated if it already exists', function () {
      assert.deepEqual(
        tabState.maybeCreateTab(this.appState, { tabValue: { tabId: 1, test: 'blue' } }).get('tabs').toJS(),
        [{ tabId: 1, test: 'blue' }])
    })

    shouldValidateAction((action) => {
      tabState.maybeCreateTab(defaultAppState, action)
    })

    shouldValidateTabValue((tabValue) => {
      tabState.maybeCreateTab(defaultAppState, { tabValue })
    })

    shouldValidateTabState((state) => {
      tabState.maybeCreateTab(state, { tabValue: { tabId: 1 } })
    })
  })

  describe('getTabsByWindowId', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1, windowId: 1 },
        { tabId: 2, windowId: 1 },
        { tabId: 3, windowId: 2 }
      ]))
    })

    it('returns the tabs with `windowId`', function () {
      assert.deepEqual(tabState.getTabsByWindowId(this.appState, 1).toJS(), [
        { tabId: 1, windowId: 1 },
        { tabId: 2, windowId: 1 }
      ])
      assert.deepEqual(tabState.getTabsByWindowId(this.appState, 2).toJS(), [
        { tabId: 3, windowId: 2 }
      ])
      assert.deepEqual(tabState.getTabsByWindowId(this.appState, 3).toJS(), [])
    })

    shouldValidateTabState((state) => {
      tabState.getTabsByWindowId(state, 1)
    })

    shouldValidateId((windowId) => {
      tabState.getTabsByWindowId(defaultAppState, windowId)
    })
  })

  describe('getTabsForWindow', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1, windowId: 1 },
        { tabId: 2, windowId: 1 },
        { tabId: 3, windowId: 2 }
      ]))
    })

    it('returns the tabs with matching the `windowId`', function () {
      assert.deepEqual(tabState.getTabsByWindow(this.appState, { windowId: 1 }).toJS(), [
        { tabId: 1, windowId: 1 },
        { tabId: 2, windowId: 1 }
      ])
      assert.deepEqual(tabState.getTabsByWindow(this.appState, { windowId: 2 }).toJS(), [
        { tabId: 3, windowId: 2 }
      ])
      assert.deepEqual(tabState.getTabsByWindow(this.appState, { windowId: 3 }).toJS(), [])
    })

    it('throws an AssertionError if `windowValue` does not contain a valid `windowId`', function () {
      assert.doesNotThrow(
        () => {
          tabState.getTabsByWindow(this.appState, { windowId: 1 })
        },
        AssertionError
      )
      assert.throws(
        () => {
          tabState.getTabsByWindow(this.appState, {})
        },
        AssertionError
      )
      assert.throws(
        () => {
          tabState.getTabsByWindow(this.appState, { windowId: 'a' })
        },
        AssertionError
      )
    })

    shouldValidateTabState((state) => {
      tabState.getTabsByWindow(state, { windowId: 1 })
    })
  })

  describe('getTabs', function () {
    shouldValidateTabState((state) => {
      tabState.getTabs(state)
    })
  })

  describe('setTabs', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1, windowId: 1 }
      ]))
    })

    it('returns a new immutable state with state.tabs set to the tab list', function () {
      let tabList = [
        { tabId: 1, windowId: 1 },
        { tabId: 2, windowId: 1 }
      ]
      assert.deepEqual(tabState.setTabs(this.appState, tabList).get('tabs').toJS(), tabList)
    })

    it('throws an AssertionError if `tabs` does not contain an Immutable.List of valid tabValue', function () {
      assert.doesNotThrow(
        () => {
          tabState.setTabs(defaultAppState, [])
        },
        AssertionError
      )
      assert.doesNotThrow(
        () => {
          tabState.setTabs(defaultAppState, Immutable.List())
        },
        AssertionError
      )
      assert.throws(
        () => {
          tabState.setTabs(defaultAppState, [{ frameKey: 1 }])
        },
        AssertionError
      )
      assert.throws(
        () => {
          tabState.setTabs(defaultAppState, {})
        },
        AssertionError
      )
      assert.throws(
        () => {
          tabState.setTabs(defaultAppState, null)
        },
        AssertionError
      )
      assert.throws(
        () => {
          tabState.setTabs(defaultAppState, 'blah')
        },
        AssertionError
      )
      assert.throws(
        () => {
          tabState.setTabs(defaultAppState, 11)
        },
        AssertionError
      )
    })

    shouldValidateTabState((state) => {
      tabState.setTabs(state, [])
    })
  })

  describe('canGoForward', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1, canGoForward: true },
        { tabId: 2, canGoForward: false },
        { tabId: 3 }
      ]))
    })

    it('returns the value of `canGoForward` for the tab matching `tabId`', function () {
      assert.equal(tabState.canGoForward(this.appState, 1), true)
      assert.equal(tabState.canGoForward(this.appState, 2), false)
    })

    it('returns false if `canGoForward` is missing the tab matching `tabId`', function () {
      assert.equal(tabState.canGoForward(this.appState, 3), false)
    })

    it('returns false if `tabId` does not exist', function () {
      assert.equal(tabState.canGoForward(this.appState, 4), false)
    })

    shouldValidateTabState((state) => {
      tabState.canGoForward(state, 1)
    })

    shouldValidateId((tabId) => {
      tabState.canGoForward(defaultAppState, tabId)
    })
  })

  describe('canGoBack', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1, canGoBack: true },
        { tabId: 2, canGoBack: false },
        { tabId: 3 }
      ]))
    })

    it('returns the value of `canGoBack` for the tab matching `tabId`', function () {
      assert.equal(tabState.canGoBack(this.appState, 1), true)
      assert.equal(tabState.canGoBack(this.appState, 2), false)
    })

    it('returns false if `canGoBack` is missing the tab matching `tabId`', function () {
      assert.equal(tabState.canGoBack(this.appState, 3), false)
    })

    it('returns false if `tabId` does not exist', function () {
      assert.equal(tabState.canGoBack(this.appState, 4), false)
    })

    shouldValidateTabState((state) => {
      tabState.canGoBack(state, 1)
    })

    shouldValidateId((tabId) => {
      tabState.canGoBack(defaultAppState, tabId)
    })
  })

  describe('canGoBack', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1, canGoBack: true },
        { tabId: 2, canGoBack: false },
        { tabId: 3 }
      ]))
    })

    it('returns the value of `canGoBack` for the tab matching `tabId`', function () {
      assert.equal(tabState.canGoBack(this.appState, 1), true)
      assert.equal(tabState.canGoBack(this.appState, 2), false)
    })

    it('returns false if `canGoBack` is missing the tab matching `tabId`', function () {
      assert.equal(tabState.canGoBack(this.appState, 3), false)
    })

    it('returns false if `tabId` does not exist', function () {
      assert.equal(tabState.canGoBack(this.appState, 4), false)
    })

    shouldValidateTabState((state) => {
      tabState.canGoBack(state, 1)
    })

    shouldValidateId((tabId) => {
      tabState.canGoBack(defaultAppState, tabId)
    })
  })

  describe('isSecure', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1, frame: { security: { isSecure: 1 } } },
        { tabId: 2, frame: { security: { isSecure: false } } },
        { tabId: 3, frame: { security: { isSecure: true } } },
        { tabId: 4, frame: { security: { blah: true } } },
        { tabId: 5 }
      ]))
    })

    it('returns the value of `isSecure` for the frame with `tabId`', function () {
      assert.equal(tabState.isSecure(this.appState, 1), 1)
      assert.equal(tabState.isSecure(this.appState, 2), false)
      assert.equal(tabState.isSecure(this.appState, 3), true)
    })

    it('returns false for the frame with `tabId` if `isSecure` is not set', function () {
      assert.equal(tabState.isSecure(this.appState, 4), false)
      assert.equal(tabState.isSecure(this.appState, 5), false)
    })

    it('returns false if a frame with `tabId` does not exist', function () {
      assert.equal(tabState.isSecure(this.appState, 6), false)
    })
  })

  describe('getFrameByTabid', function () {
    before(function () {
      this.appState = defaultWindowState.set('tabs', Immutable.fromJS([
        { tabId: 1, frame: { loading: true } },
        { tabId: 2, frame: { } },
        { tabId: 3 }
      ]))
    })

    describe('no currentWindow', function () {
      it('returns the frame for the tab matching `tabId`', function () {
        assert.deepEqual(tabState.getFrameByTabId(this.appState, 1), Immutable.fromJS({ loading: true }))
        assert.deepEqual(tabState.getFrameByTabId(this.appState, 2), Immutable.fromJS({ }))
      })

      it('returns null if there is no frame for `tabId`', function () {
        assert.equal(tabState.getFrameByTabId(this.appState, 3), null)
        assert.equal(tabState.getFrameByTabId(this.appState, 4), null)
      })
    })

    describe('with currentWindow', function () {
      before(function () {
        this.appStateWithCurrentWindow = this.appState.setIn(['currentWindow', 'frames'], Immutable.fromJS([
          { tabId: 1, loading: false },
          { tabId: 2 }
        ]))
      })

      it('returns the frame from currentWindow matching `tabId`', function () {
        assert.deepEqual(tabState.getFrameByTabId(this.appStateWithCurrentWindow, 1), Immutable.fromJS({ tabId: 1, loading: false }))
        assert.deepEqual(tabState.getFrameByTabId(this.appStateWithCurrentWindow, 2), Immutable.fromJS({ tabId: 2 }))
      })

      it('returns null if there is no frame for `tabId`', function () {
        assert.equal(tabState.getFrameByTabId(this.appStateWithCurrentWindow, 3), null)
      })
    })
  })
})
