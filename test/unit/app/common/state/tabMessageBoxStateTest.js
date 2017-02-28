/* global describe, it, before, after */
const tabMessageBoxState = require('../../../../../app/common/state/tabMessageBoxState')
const tabState = require('../../../../../app/common/state/tabState')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')

const defaultAppState = Immutable.fromJS({
  windows: [{
    windowId: 1,
    windowUUID: 'uuid'
  }],
  tabs: []
})

const exampleMessageBox = Immutable.fromJS({
  message: 'example message',
  title: 'example title',
  buttons: ['OK'],
  suppress: false,
  showSuppress: false
})

const defaultTabId = 1

const defaultTab = Immutable.fromJS({
  tabId: defaultTabId,
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
})
