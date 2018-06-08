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

const twoTabsAppState = defaultAppState
  .set('tabs', Immutable.fromJS([
    { tabId: 1, index: 0, windowId: 1 },
    { tabId: 2, index: 1, windowId: 1 }
  ]))
  .set('tabsInternal', Immutable.fromJS({
    index: {
      1: 0,
      2: 1
    }
  }))

// NOTE: null check can be optional since resolveTabId sets a default if null
const shouldValidateId = function (check, skipNullCheck) {
  it('throws an AssertionError if tabId is not a number', function () {
    if (!skipNullCheck) {
      assert.throws(
        () => {
          check(null)
        },
        AssertionError
      )
    }
    assert.throws(
      () => {
        check('b')
      },
      AssertionError
    )
    assert.doesNotThrow(
      () => {
        check('1')
      },
      AssertionError
    )
  })

  it('throws an AssertionError if tabId < 1 and !== -1 and !== -2', function () {
    assert.throws(
      () => {
        check(0)
      },
      AssertionError
    )
    assert.throws(
      () => {
        check(-3)
      },
      AssertionError
    )
    assert.doesNotThrow(
      () => {
        check(-2)
      },
      AssertionError
    )
    assert.doesNotThrow(
      () => {
        check(-1)
      },
      AssertionError
    )
  })
}

const shouldValidateTabState = function (check) {
  it('throws an AssertionError if state does not contain a `tabs` array', function () {
    assert.doesNotThrow(
      () => {
        check(Immutable.fromJS({ tabs: [] }))
      },
      AssertionError
    )
    assert.throws(
      () => {
        check(Immutable.Map({}))
      },
      AssertionError
    )
  })

  it('throws an AssertionError if state is not convertable to an Immutable.Map', function () {
    assert.doesNotThrow(
      () => {
        check({ tabs: [] })
      },
      AssertionError
    )
    assert.throws(
      () => {
        check([])
      },
      AssertionError
    )
    assert.throws(
      () => {
        check('test')
      },
      AssertionError
    )
    assert.throws(
      () => {
        check(null)
      },
      AssertionError
    )
  })
}

const shouldValidateTabValue = function (check) {
  it('throws an AssertionError if `tabValue` does not contain a valid `tabId`', function () {
    assert.doesNotThrow(
      () => {
        check({ tabId: 1, index: 0, windowId: 1 })
      },
      AssertionError
    )
    assert.throws(
      () => {
        check({})
      },
      AssertionError
    )
    assert.throws(
      () => {
        check({ tabId: 'a' })
      },
      AssertionError
    )
  })
}

const shouldValidateAction = function (check) {
  it('throws an AssertionError if action does not contain a `tabValue` that is convertable to an Immutable.Map', function () {
    assert.doesNotThrow(
      () => {
        check(Immutable.fromJS({ tabValue: { tabId: 1, index: 0, windowId: 1 } }))
        check({ tabValue: { tabId: 1, index: 0, windowId: 1 } })
      },
      AssertionError
    )
    assert.throws(
      () => {
        check(Immutable.Map({ blah: {} }))
      },
      AssertionError
    )
    assert.throws(
      () => {
        check(Immutable.Map({}))
      },
      AssertionError
    )
  })

  it('throws an AssertionError if `action` is not convertable to an Immutable.Map', function () {
    assert.doesNotThrow(
      () => {
        check({ tabValue: { tabId: 1, index: 0, windowId: 1 } })
      },
      AssertionError
    )
    assert.throws(
      () => {
        check([])
      },
      AssertionError
    )
    assert.throws(
      () => {
        check('test')
      },
      AssertionError
    )
    assert.throws(
      () => {
        check(null)
      },
      AssertionError
    )
  })
}

describe('tabState unit tests', function () {
  describe('getPathByTabId', function () {
    it('returns null if tab is not found', function () {
      assert.equal(tabState.getPathByTabId(twoTabsAppState, 333), null)
    })
    it('returns path if index found (as mutable array)', function () {
      assert.deepEqual(tabState.getPathByTabId(twoTabsAppState, 1), ['tabs', 0])
    })
  })

  describe('getByTabId', function () {
    before(function () {
      this.appState = twoTabsAppState
    })

    it('returns the tab for `tabId` if it exists', function () {
      let tab = tabState.getByTabId(this.appState, 2)
      assert(tab)
      assert.equal(1, tab.get('windowId'))
      assert.equal(2, tab.get('tabId'))
    })

    it('returns null if the tab for `tabId` does not exist', function () {
      let tab = tabState.getByTabId(defaultAppState, 3)
      assert.equal(null, tab)
    })

    shouldValidateId((tabId) => {
      tabState.getByTabId(defaultAppState, tabId)
    }, true)

    shouldValidateTabState((state) => {
      tabState.getByTabId(state, 1)
    })
  })

  describe('removeTabByTabId', function () {
    before(function () {
      this.appState = twoTabsAppState
    })

    it('returns a new immutable state with the tab for `tabId` removed if it exists', function () {
      assert.deepEqual(tabState.removeTabByTabId(this.appState, 2).get('tabs').toJS(), [twoTabsAppState.getIn(['tabs', 0]).toJS(), {}])
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
      this.appState = twoTabsAppState
    })

    it('returns a new immutable state with the tab at `index` removed if it exists', function () {
      assert.deepEqual(tabState.removeTabByIndex(this.appState, 1).get('tabs').toJS(), [ twoTabsAppState.getIn(['tabs', 0]).toJS(), {} ])
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

  describe('insertTab', function () {
    before(function () {
      this.appState = defaultAppState
        .set('tabs', Immutable.fromJS([ { tabId: 1, index: 0, windowId: 1 } ]))
        .set('tabsInternal', Immutable.fromJS({index: { 1: 0 }}))
    })

    it('returns a new immutable state with the tabValue appended to the end of the list', function () {
      assert.deepEqual(
        tabState.insertTab(this.appState, { tabValue: { tabId: 2, index: 1, windowId: 1 } }).get('tabs').toJS(),
        [{ tabId: 1, index: 0, windowId: 1 }, { tabId: 2, index: 1, windowId: 1 }])
    })

    it('throws an AssertionError if there is already a tab with the tabId', function () {
      assert.throws(
        () => {
          tabState.insertTab(this.appState, { tabValue: { tabId: 1, index: 0, windowId: 1 } })
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
      tabState.insertTab(state, { tabValue: { tabId: 1, index: 0, windowId: 1 } })
    })
  })

  describe('updateTab', function () {
    before(function () {
      this.appState = defaultAppState
        .set('tabs', Immutable.fromJS([
          {
            windowId: 1,
            tabId: 1,
            index: 0,
            myProp: 'test1',
            myProp2: 'blah'
          },
          {
            windowId: 1,
            tabId: 2,
            index: 1,
            myProp: 'test2',
            myProp2: 'blah'
          }
        ]))
      .set('tabsInternal', Immutable.fromJS({
        index: {
          1: 0,
          2: 1
        }
      }))
    })

    it('returns a new immutable state with the tabValue updated if it already exists', function () {
      assert.deepEqual(
        tabState.updateTab(this.appState, { tabValue: { tabId: 1, test: 'blue', myProp: 'test2' } }).get('tabs').toJS(), [
          {
            tabId: 1,
            index: 0,
            test: 'blue',
            windowId: 1,
            myProp: 'test2',
            myProp2: 'blah'
          },
          {
            windowId: 1,
            tabId: 2,
            index: 1,
            myProp: 'test2',
            myProp2: 'blah'
          }
        ])
    })

    it('returns a new immutable state with the tabValue replaced if it already exists and `replace` is true', function () {
      assert.deepEqual(
        tabState.updateTab(this.appState, { replace: true, tabValue: { tabId: 1, index: 0, windowId: 1, test: 'blue', myProp: 'test2' } }).get('tabs').toJS(), [
          {
            tabId: 1,
            index: 0,
            windowId: 1,
            test: 'blue',
            myProp: 'test2'
          },
          {
            windowId: 1,
            tabId: 2,
            index: 1,
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
      this.appState = defaultAppState
        .set('tabs', Immutable.fromJS([
          { tabId: 1, index: 0, windowId: 1 }
        ]))
        .setIn(['tabsInternal', 'index', '1'], 0)
    })

    it('returns a new immutable state with the tabValue appended to the end of the list if it does not already exist', function () {
      assert.deepEqual(
        tabState.maybeCreateTab(this.appState, { tabValue: { tabId: 2, index: 1, windowId: 1 } }).get('tabs').toJS(),
        [{ tabId: 1, index: 0, windowId: 1 }, { tabId: 2, index: 1, windowId: 1 }])
    })

    it('returns a new immutable state with the tabValue updated if it already exists', function () {
      assert.deepEqual(tabState.maybeCreateTab(this.appState, { tabValue: { tabId: 1, index: 0, windowId: 1, test: 'blue' } }).get('tabs').toJS(),
        [{ tabId: 1, index: 0, windowId: 1, test: 'blue' }])
    })

    shouldValidateAction((action) => {
      tabState.maybeCreateTab(defaultAppState, action)
    })

    shouldValidateTabValue((tabValue) => {
      tabState.maybeCreateTab(defaultAppState, { tabValue })
    })

    shouldValidateTabState((state) => {
      tabState.maybeCreateTab(state, { tabValue: { tabId: 1, index: 0, windowId: 1 } })
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
          tabState.setTabs(defaultAppState, [{ index: 0 }])
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

  describe('getTabPropertyByTabId', function () {
    before(function () {
      this.appState = defaultAppState
        .set('tabs', Immutable.fromJS([
          { tabId: 1, prop1: 'test1', prop2: 'test2' },
          { tabId: 2, prop1: 'test3' },
          { tabId: 3, prop2: 'test4' }
        ]))
        .set('tabsInternal', Immutable.fromJS({
          index: {
            1: 0,
            2: 1,
            3: 2
          }
        }))
    })

    it('returns the value for `tabId`.`key`', function () {
      assert.equal(tabState.getTabPropertyByTabId(this.appState, 1, 'prop1'), 'test1')
      assert.equal(tabState.getTabPropertyByTabId(this.appState, 1, 'prop2'), 'test2')
      assert.equal(tabState.getTabPropertyByTabId(this.appState, 2, 'prop1'), 'test3')
      assert.equal(tabState.getTabPropertyByTabId(this.appState, 3, 'prop2'), 'test4')
    })

    it('returns null if `key` does not exist for `tabId`', function () {
      assert.equal(tabState.getTabPropertyByTabId(this.appState, 1, 'prop3'), null)
    })

    it('throws assertion error if `tabId` does not exist', function () {
      assert.throws(
        () => {
          tabState.getTabPropertyByTabId(this.appState, 4, 'prop1')
        },
        AssertionError
      )
    })
  })

  describe('getOpenerTabId', function () {
    it('returns tabId of the opener', function () {
      const tempState = twoTabsAppState
        .setIn(['tabs', 1, 'openerTabId'], 1)
      assert.equal(tabState.getOpenerTabId(tempState, 2), 1)
    })

    it('defaults to TAB_ID_NONE if not found', function () {
      assert.equal(tabState.getOpenerTabId(twoTabsAppState, 2), tabState.TAB_ID_NONE)
    })

    it('returns TAB_ID_NONE if tabId is invalid', function () {
      const tempState = twoTabsAppState
        .setIn(['tabs', 1, 'openerTabId'], 17)
      assert.equal(tabState.getOpenerTabId(tempState, 2), tabState.TAB_ID_NONE)
    })
  })

  describe('getActiveTabId', function () {
    before(function () {
      this.appState = defaultAppState
        .set('tabs', Immutable.fromJS([
          { tabId: 4, windowId: 1, active: true },
          { tabId: 5, windowId: 2, active: true },
          { tabId: 3, windowId: 2 }
        ]))
        .set('windows', Immutable.fromJS([
          { windowId: 1 },
          { windowId: 2, focused: true }
        ]))
    })
    it('obtains active tabId when window is specified', function () {
      const windowId = 1
      const expectedTabId = 4
      assert.equal(tabState.getActiveTabId(this.appState, windowId), expectedTabId)
    })
    it('obtains active tabId when no window is specified based on focused window', function () {
      const expectedTabId = 5
      assert.equal(tabState.getActiveTabId(this.appState), expectedTabId)
    })
  })

  describe('resolveTabId', function () {
    before(function () {
      this.appState = defaultAppState
        .set('tabs', Immutable.fromJS([
          { tabId: 4, windowId: 1, active: true },
          { tabId: 5, windowId: 2, active: true },
          { tabId: 3, windowId: 2 }
        ]))
        .set('windows', Immutable.fromJS([
          { windowId: 1 },
          { windowId: 2, focused: true }
        ]))
    })
    it('resolves numeric tabs', function () {
      const tabId = 4
      assert.equal(tabState.resolveTabId(this.appState, tabId), tabId)
    })
    it('resolves active tab', function () {
      const expectedTabId = 5
      assert.equal(tabState.resolveTabId(this.appState, tabState.TAB_ID_ACTIVE), expectedTabId)
    })
  })

  describe('navigationState', function () {
    before(function () {
      this.url = 'http://url'
      this.virtualURL = 'http://virtualURL'
      this.origin = 'http://url/'
      this.navigationState = Immutable.fromJS({
        visibleEntry: {
          url: this.url,
          virtualURL: this.virtualURL,
          origin: this.origin
        },
        activeEntry: {
          url: 'active entry',
          virtualURL: 'active virtual entry',
          origin: 'active origin/'
        },
        lastCommittedEntry: {
          url: 'last entry',
          virtual: 'last virtual entry',
          origin: 'last origin/'
        }
      })
      this.appState = twoTabsAppState.setIn(['tabs', 0, 'navigationState'], this.navigationState)
      this.appState = this.appState.setIn(['tabs', 1, 'navigationState'], Immutable.fromJS({
        visibleEntry: {
          url: 'http://url2',
          virtualURL: 'http://virtualURL2'
        }
      }))
    })

    describe('setNavigationState', function () {
      before(function () {
        this.appState = twoTabsAppState
        this.navigationEntry = Immutable.fromJS({
          visibleEntry: {
            url: 'test'
          }
        })
        this.appState = tabState.setNavigationState(this.appState, 1, this.navigationEntry)
      })

      it('sets appState.tabs.`tabId`.navigationState to the specified value', function () {
        assert.deepEqual(this.appState.getIn(['tabs', 0, 'navigationState']), this.navigationEntry)
      })

      it('does not change other tabs ids', function () {
        assert.equal(this.appState.getIn(['tabs', 1, 'navigationState']), undefined)
      })
    })

    describe('getVisibleOrigin', function () {
      it('returns the value from appState.tabs.`tabId`.navigationState.visibleEntry.origin with trailing slash removed', function () {
        assert.deepEqual(tabState.getVisibleOrigin(this.appState, 1), 'http://url')
      })
    })

    describe('getVisibleEntry', function () {
      it('returns the value from appState.tabs.`tabId`.navigationState.visibleEntry', function () {
        assert.deepEqual(tabState.getVisibleEntry(this.appState, 1).toJS(), this.navigationState.get('visibleEntry').toJS())
      })
    })

    describe('getVisibleURL', function () {
      it('returns the value from appState.tabs.`tabId`.navigationState.visibleEntry.url', function () {
        assert.deepEqual(tabState.getVisibleURL(this.appState, 1), this.url)
      })
    })

    describe('getVisibleVirtualURL', function () {
      it('returns the value from appState.tabs.`tabId`.navigationState.visibleEntry.virtualURL', function () {
        assert.deepEqual(tabState.getVisibleVirtualURL(this.appState, 1), this.virtualURL)
      })
    })
  })
})
