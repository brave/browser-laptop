/* global describe, it, before */
const tabState = require('../../../../app/common/state/tabState')
const Immutable = require('immutable')
const assert = require('assert')

const defaultAppState = Immutable.fromJS({
  tabs: [],
  otherProp: true
})

describe('tabState', function () {
  describe('createTab', function () {
    it('creates a new tab from the defaultTabState', function () {
      let tab = tabState.createTab({})
      tabState.defaultTabState.keys((key) => {
        assert.equal(tabState.defaultTabState.get(key), tab.get(key))
      })
    })

    it('merges supplied and default values', function () {
      let tab = tabState.createTab({tabId: 20, myProp: 'test'})
      tabState.defaultTabState.keys((key) => {
        if (key !== 'tabId') {
          assert.equal(tabState.defaultTabState.get(key), tab.get(key))
        }
      })
      assert.equal(20, tab.get('tabId'))
      assert.equal('test', tab.get('myProp'))
    })
  })

  describe('getByTabId', function () {
    describe('`tabId` exists in appState', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([
          {
            windowId: 1,
            frameKey: 1,
            tabId: 2
          }
        ]))
      })

      it('returns the tab for `tabId` from the appState', function () {
        let tab = tabState.getByTabId(this.appState, 2)
        assert(tab)
        assert.equal(1, tab.get('windowId'))
        assert.equal(1, tab.get('frameKey'))
        assert.equal(2, tab.get('tabId'))
      })
    })

    describe('`tabId` does not exist in appState', function () {
      it('returns null', function () {
        let tab = tabState.getByTabId(defaultAppState, 2)
        assert.equal(null, tab)
      })
    })
  })

  describe('closeTab', function () {
    describe('`tabId` exists in appState', function () {
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

        this.newAppState = tabState.closeTab(this.appState, 2)
      })

      it('removes the tab from the appState', function () {
        let tab2 = this.newAppState.get('tabs').find((tab) => tab.get('tabId') === 2)
        assert.equal(undefined, tab2)
        let tab1 = this.newAppState.get('tabs').find((tab) => tab.get('tabId') === 1)
        assert(tab1)
      })

      it('does not change other values in the appState', function () {
        let tab = this.newAppState.get('tabs').find((tab) => tab.get('tabId') === 1)
        assert(tab)
        assert.equal('test1', tab.get('myProp'))
        assert.equal('blah', tab.get('myProp2'))
        assert.equal(1, tab.get('windowId'))
        assert.equal(1, tab.get('frameKey'))
        assert.equal(1, tab.get('tabId'))
        assert.equal(true, this.newAppState.get('otherProp'))
      })
    })

    describe('`tabId` does not exist in appState', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([
          {
            windowId: 1,
            frameKey: 1,
            tabId: 1,
            myProp: 'test1',
            myProp2: 'blah'
          }
        ]))

        this.newAppState = tabState.closeTab(this.appState, 2)
      })

      it('returns the original appState', function () {
        assert(this.appState.equals(this.newAppState))
      })
    })
  })

  describe('getOrCreateByTabId', function () {
    describe('`tabId` exists in appState', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([
          {
            windowId: 1,
            frameKey: 1,
            tabId: 2
          }
        ]))
      })

      it('returns the tab for `tabId` from the appState', function () {
        let tab = tabState.getOrCreateByTabId(this.appState, 2)
        assert(tab)
        assert.equal(1, tab.get('windowId'))
        assert.equal(1, tab.get('frameKey'))
        assert.equal(2, tab.get('tabId'))
      })
    })

    describe('`tabId` does not exist in appState', function () {
      it('creates a new tab for `tabId`', function () {
        let tab = tabState.getOrCreateByTabId(defaultAppState, 2)
        assert(tab)
        assert.equal(-1, tab.get('windowId'))
        assert.equal(-1, tab.get('frameKey'))
        assert.equal(2, tab.get('tabId'))
      })
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

      this.newAppState = tabState.updateTab(this.appState, 2, Immutable.fromJS({
        windowId: 1,
        frameKey: 1,
        tabId: 2,
        myProp: 'test3'
      }))
    })

    it('error for no such tabId')

    it('updates the tab values for `tabId` in the appState', function () {
      let tab = this.newAppState.get('tabs').find((tab) => tab.get('tabId') === 2)
      assert(tab)
      assert.equal('test3', tab.get('myProp'))
      assert.equal(undefined, tab.get('myProp2'))
      assert.equal(1, tab.get('windowId'))
      assert.equal(1, tab.get('frameKey'))
      assert.equal(2, tab.get('tabId'))
    })

    it('does not change other values in the appState', function () {
      let tab = this.newAppState.get('tabs').find((tab) => tab.get('tabId') === 1)
      assert(tab)
      assert.equal('test1', tab.get('myProp'))
      assert.equal('blah', tab.get('myProp2'))
      assert.equal(1, tab.get('windowId'))
      assert.equal(1, tab.get('frameKey'))
      assert.equal(1, tab.get('tabId'))
      assert.equal(true, this.newAppState.get('otherProp'))
    })
  })

  describe('getOrCreateByTabId', function () {
    describe('`tabId` exists in appState', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([
          {
            windowId: 1,
            frameKey: 1,
            tabId: 2
          }
        ]))
      })

      it('returns the tab for `tabId` from the appState', function () {
        let tab = tabState.getOrCreateByTabId(this.appState, 2)
        assert(tab)
        assert.equal(1, tab.get('windowId'))
        assert.equal(1, tab.get('frameKey'))
        assert.equal(2, tab.get('tabId'))
      })
    })

    describe('`tabId` does not exist in appState', function () {
      it('creates a new tab for `tabId`', function () {
        let tab = tabState.getOrCreateByTabId(defaultAppState, 2)
        assert(tab)
        assert.equal(-1, tab.get('windowId'))
        assert.equal(-1, tab.get('frameKey'))
        assert.equal(2, tab.get('tabId'))
      })
    })
  })

  describe('getPersistentTabState', function () {
    before(function () {
      this.tab = Immutable.fromJS({
        windowId: 1,
        frameKey: 1,
        tabId: 2,
        loginRequiredDetail: {
          request: { url: 'someurl' },
          authInfo: { authInfoProp: 'value' }
        }
      })
      this.tab = tabState.getPersistentTabState(this.tab)
    })

    it('should keep frameKey', function () {
      assert.equal(1, this.tab.get('frameKey'))
    })

    it('should remove windowId', function () {
      assert.equal(undefined, this.tab.get('tabId'))
    })

    it('should remove tabId', function () {
      assert.equal(undefined, this.tab.get('tabId'))
    })

    it('should remove loginRequiredDetail', function () {
      assert.equal(undefined, this.tab.get('loginRequiredDetail'))
    })
  })
})
