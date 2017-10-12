/* global describe, it, before, after */
const tabMessageBoxState = require('../../../../../app/common/state/tabMessageBoxState')
const tabState = require('../../../../../app/common/state/tabState')
const {makeImmutable} = require('../../../../../app/common/state/immutableUtil')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')

const defaultTabId = 1

const sampleAppState = {
  windows: [{
    windowId: 1,
    windowUUID: 'uuid'
  }],
  tabs: [],
  tabsInternal: {
    index: {}
  }
}

sampleAppState.tabsInternal.index[defaultTabId] = 0

const defaultAppState = Immutable.fromJS(sampleAppState)

const exampleMessageBox = Immutable.fromJS({
  message: 'example message',
  title: 'example title',
  buttons: ['OK'],
  suppress: true,
  showSuppress: true
})

const defaultTab = Immutable.fromJS({
  tabId: defaultTabId,
  index: 0,
  windowId: 1,
  windowUUID: 'uuid',
  url: 'https://brave.com',
  messageBoxDetail: exampleMessageBox
})

describe('tabMessageBoxState unit tests', function () {
  describe('show', function () {
    describe('when a detail object does not exist', function () {
      before(function () {
        const tab = defaultTab.delete('messageBoxDetail')
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([tab]))
      })

      it('creates the detail record (including setting opener)', function () {
        const newAppState = tabMessageBoxState.show(this.appState, {tabId: defaultTabId, detail: exampleMessageBox})
        const tab = tabState.getByTabId(newAppState, defaultTabId)
        assert(tab)
        const expectedMessageBox = exampleMessageBox.set('opener', defaultTab.get('url'))
        assert.deepEqual(expectedMessageBox, tab.get('messageBoxDetail'))
      })
    })

    describe('when a detail object exists', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      })

      it('removes the detail if null', function () {
        const newAppState = tabMessageBoxState.show(this.appState, {tabId: defaultTabId})
        let tab = tabState.getByTabId(newAppState, defaultTabId)
        assert(tab)
        assert.equal(undefined, tab.get('messageBoxDetail'))
      })

      it('removes the detail if empty', function () {
        const newAppState = tabMessageBoxState.show(this.appState, {tabId: defaultTabId, detail: {}})
        let tab = tabState.getByTabId(newAppState, defaultTabId)
        assert(tab)
        assert.equal(undefined, tab.get('messageBoxDetail'))
      })

      it('overwrites the existing record', function () {
        const exampleMessageBox2 = exampleMessageBox.set('message', 'example message 2')
        const newAppState = tabMessageBoxState.show(this.appState, {tabId: defaultTabId, detail: exampleMessageBox2})
        let tab = tabState.getByTabId(newAppState, defaultTabId)
        assert(tab)
        const expectedMessageBox = exampleMessageBox2.set('opener', defaultTab.get('url'))
        assert.deepEqual(expectedMessageBox, tab.get('messageBoxDetail'))
      })
    })

    describe('when data is missing', function () {
      it('does nothing when tabId is missing', function () {
        const newAppState = tabMessageBoxState.show(defaultAppState, {})
        assert.equal(newAppState, defaultAppState)
      })

      it('does nothing when tab value is not found', function () {
        const newAppState = tabMessageBoxState.show(defaultAppState, {tabId: defaultTabId})
        assert.equal(newAppState, defaultAppState)
      })
    })
  })

  describe('hasMessageBoxDetail', function () {
    it('returns true if detail exists', function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      assert.equal(tabMessageBoxState.hasMessageBoxDetail(this.appState, defaultTabId), true)
    })
    it('returns false if tabId is not found', function () {
      assert.equal(tabMessageBoxState.hasMessageBoxDetail(defaultAppState, 1111), false)
    })
  })

  describe('getDetail', function () {
    it('returns null if tabId is falsey', function () {
      assert.equal(null, tabMessageBoxState.getDetail(defaultAppState))
      assert.equal(null, tabMessageBoxState.getDetail(defaultAppState, undefined))
      assert.equal(null, tabMessageBoxState.getDetail(defaultAppState, null))
    })

    it('returns null if tabId is not a number', function () {
      assert.equal(null, tabMessageBoxState.getDetail(defaultAppState, 'testing'))
      assert.equal(null, tabMessageBoxState.getDetail(defaultAppState, true))
    })

    it('returns detail object from tab value (if found)', function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      const detail = tabMessageBoxState.getDetail(this.appState, defaultTabId)
      assert.deepEqual(exampleMessageBox, detail)
    })

    it('returns null if detail object does not exist in tab value', function () {
      const tab = defaultTab.delete('messageBoxDetail')
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([tab]))
      assert.equal(null, tabMessageBoxState.getDetail(defaultAppState, defaultTabId))
    })

    it('returns null if tab value is not found', function () {
      assert.equal(null, tabMessageBoxState.getDetail(defaultAppState, defaultTabId))
    })
  })

  describe('update', function () {
    let showSpy

    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      showSpy = sinon.spy(tabMessageBoxState, 'show')
    })

    after(function () {
      showSpy.restore()
    })

    it('calls show', function () {
      const state = this.appState
      const action = {tabId: defaultTabId, detail: exampleMessageBox}
      tabMessageBoxState.update(state, action)
      assert.equal(showSpy.withArgs(state, action).calledOnce, true)
    })
  })

  describe('removeDetail', function () {
    describe('when a detail object exists', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.appState = tabMessageBoxState.removeDetail(this.appState, {tabId: defaultTabId})
        this.tabState = tabState.getByTabId(this.appState, defaultTabId)
        assert(this.tabState)
      })

      it('removes the detail', function () {
        assert.equal(undefined, this.tabState.get('messageBoxDetail'))
      })
    })

    describe('when a detail object does not exist', function () {
      before(function () {
        const tab = defaultTab.delete('messageBoxDetail')
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([tab]))
        this.appState = tabMessageBoxState.removeDetail(this.appState, {tabId: defaultTabId})
        this.tabState = tabState.getByTabId(this.appState, defaultTabId)
        assert(this.tabState)
      })

      it('does nothing (does not crash)', function () {
        assert.equal(undefined, this.tabState.get('messageBoxDetail'))
      })
    })

    describe('when data is missing', function () {
      it('does nothing when tabId is missing', function () {
        const newAppState = tabMessageBoxState.removeDetail(defaultAppState, {})
        assert.equal(newAppState, defaultAppState)
      })

      it('does nothing when tab value is not found', function () {
        const newAppState = tabMessageBoxState.removeDetail(defaultAppState, {tabId: defaultTabId})
        assert.equal(newAppState, defaultAppState)
      })
    })
  })

  describe('getSuppress', function () {
    it('when data exists', function () {
      const appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      const suppress = tabMessageBoxState.getSuppress(appState, defaultTabId)
      assert.equal(suppress, defaultTab.getIn(['messageBoxDetail', 'suppress']))
    })

    it('when tab is missing', function () {
      const suppress = tabMessageBoxState.getSuppress(defaultAppState, defaultTabId)
      assert.equal(suppress, false)
    })

    it('when data is missing', function () {
      let appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      appState = appState.deleteIn(['tabs', 0, 'messageBoxDetail', 'suppress'])
      const suppress = tabMessageBoxState.getSuppress(appState, defaultTabId)
      assert.equal(suppress, false)
    })
  })

  describe('getShowSuppress', function () {
    it('when data exists', function () {
      const appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      const getShowSuppress = tabMessageBoxState.getShowSuppress(appState, defaultTabId)
      assert.equal(getShowSuppress, defaultTab.getIn(['messageBoxDetail', 'showSuppress']))
    })

    it('when tab is missing', function () {
      const getShowSuppress = tabMessageBoxState.getShowSuppress(defaultAppState, defaultTabId)
      assert.equal(getShowSuppress, false)
    })

    it('when data is missing', function () {
      let appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      appState = appState.deleteIn(['tabs', 0, 'messageBoxDetail', 'showSuppress'])
      const getShowSuppress = tabMessageBoxState.getShowSuppress(appState, defaultTabId)
      assert.equal(getShowSuppress, false)
    })
  })

  describe('getTitle', function () {
    it('when data exists', function () {
      const appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      const title = tabMessageBoxState.getTitle(appState, defaultTabId)
      assert.equal(title, defaultTab.getIn(['messageBoxDetail', 'title']))
    })

    it('when tab is missing', function () {
      const title = tabMessageBoxState.getTitle(defaultAppState, defaultTabId)
      assert.equal(title, '')
    })

    it('when data is missing', function () {
      let appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      appState = appState.deleteIn(['tabs', 0, 'messageBoxDetail', 'title'])
      const title = tabMessageBoxState.getTitle(appState, defaultTabId)
      assert.equal(title, '')
    })
  })

  describe('getButtons', function () {
    let defaultValue = makeImmutable(['ok'])

    it('when data exists', function () {
      const appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      const buttons = tabMessageBoxState.getButtons(appState, defaultTabId)
      assert.equal(buttons, defaultTab.getIn(['messageBoxDetail', 'buttons']))
    })

    it('when tab is missing', function () {
      const buttons = tabMessageBoxState.getButtons(defaultAppState, defaultTabId)
      assert.deepEqual(buttons, defaultValue)
    })

    it('when data is missing', function () {
      let appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      appState = appState.deleteIn(['tabs', 0, 'messageBoxDetail', 'buttons'])
      const buttons = tabMessageBoxState.getButtons(appState, defaultTabId)
      assert.deepEqual(buttons, defaultValue)
    })
  })

  describe('getPropertyByTabId', function () {
    it('when everything is correct', function () {
      let appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      const property = tabMessageBoxState.getPropertyByTabId(appState, defaultTabId, 'suppress')
      assert.deepEqual(property, exampleMessageBox.get('suppress'))
    })

    it('when tab is wrong', function () {
      let appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      const property = tabMessageBoxState.getPropertyByTabId(appState, 3, 'message')
      assert.deepEqual(property, undefined)
    })

    it('when property is missing', function () {
      let appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
      appState = appState.deleteIn(['tabs', 0, 'messageBoxDetail', 'suppress'])
      const property = tabMessageBoxState.getPropertyByTabId(appState, defaultTabId, 'suppress')
      assert.deepEqual(property, undefined)
    })
  })
})
