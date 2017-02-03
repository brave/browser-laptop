/* global describe, it, before */
const messageBoxState = require('../../../../../app/common/state/messageBoxState')
const tabState = require('../../../../../app/common/state/tabState')
const Immutable = require('immutable')
const assert = require('assert')

const defaultAppState = Immutable.fromJS({
  windows: [{
    windowId: 1,
    windowUUID: 'uuid'
  }],
  tabs: []
})

const defaultTab = Immutable.fromJS({
  tabId: 1,
  windowId: 1,
  windowUUID: 'uuid',
  messageBoxDetail: {
    message: 'example message',
    title: 'example title',
    buttons: ['OK'],
    suppress: false,
    showSuppress: false
  }
})

describe('messageBoxState tests', function () {
  describe('show', function () {
    describe('with null detail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.appState = messageBoxState.show(this.appState, {tabId: 1})
      })

      it('removes the detail', function () {
        let tab = tabState.getByTabId(this.appState, 1)
        assert(tab)
        assert.equal(undefined, tab.get('messageBoxDetail'))
      })
    })

    describe('with empty detail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.appState = messageBoxState.show(this.appState, {tabId: 1, detail: {}})
      })

      it('removes the detail', function () {
        let tab = tabState.getByTabId(this.appState, 1)
        assert(tab)
        assert.equal(undefined, tab.get('messageBoxDetail'))
      })
    })

    describe('`tabId` exists in appState', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([
          {
            tabId: 1
          }
        ]))
        this.appState = messageBoxState.show(this.appState, {tabId: 1,
          detail: {
            request: { url: 'someurl' },
            authInfo: { authInfoProp: 'value' }
          }})
      })

      it('sets the detail for `tabId` in the appState', function () {
        let tab = tabState.getByTabId(this.appState, 1)
        assert(tab)
        let messageBoxDetail = tab.get('messageBoxDetail')
        assert.equal('someurl', messageBoxDetail.getIn(['request', 'url']))
        assert.equal('value', messageBoxDetail.getIn(['authInfo', 'authInfoProp']))
      })
    })

    describe('`tabId` does not exist in appState', function () {
      before(function () {
        this.appState = messageBoxState.show(defaultAppState, {tabId: 1,
          detail: {
            request: { url: 'someurl' },
            authInfo: { authInfoProp: 'value' }
          }})
      })

      it('returns the state', function () {
        assert.equal(defaultAppState, this.appState)
      })
    })
  })

  describe('getDetail', function () {
    describe('`tabId` exists in appState with messageBoxDetail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.messageBoxDetail = messageBoxState.getDetail(this.appState, 1)
      })

      it('returns the detail for `tabId`', function () {
        assert.equal(defaultTab.getIn(['messageBoxDetail', 'message']), this.messageBoxDetail.get('message'))
        assert.equal(defaultTab.getIn(['messageBoxDetail', 'title']), this.messageBoxDetail.get('title'))
      })
    })

    describe('`tabId` exists in appState with no messageBoxDetail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([
          {
            tabId: 1
          }
        ]))
        this.messageBoxDetail = messageBoxState.getDetail(this.appState, 1)
      })

      it('returns null', function () {
        assert.equal(null, this.messageBoxDetail)
      })
    })

    describe('`tabId` does not exist in appState', function () {
      before(function () {
        this.messageBoxDetail = messageBoxState.getDetail(defaultAppState, 1)
      })

      it('returns null', function () {
        assert.equal(null, this.messageBoxDetail)
      })
    })
  })

  describe('update', function () {
    // TODO: assert it calls show (use spy)
  })

  describe('removeDetail', function () {
    describe('`tabId` exists in appState with messageBoxDetail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.appState = messageBoxState.removeDetail(this.appState, {tabId: 1,
          detail: {
            message: 'example message',
            title: 'example title',
            buttons: ['OK'],
            suppress: false,
            showSuppress: false
          }})
      })

      it('removes the detail', function () {
        let tab = tabState.getByTabId(this.appState, 1)
        assert(tab)
        assert.equal(undefined, tab.get('messageBoxDetail'))
      })
    })

    describe('`tabId` exists in appState with no messageBoxDetail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([{ tabId: 1 }]))
        this.appState = messageBoxState.removeDetail(this.appState, {tabId: 1,
          detail: {
            message: 'example message',
            title: 'example title',
            buttons: ['OK'],
            suppress: false,
            showSuppress: false
          }})
      })

      it('returns the unmodified appState', function () {
        let tab = tabState.getByTabId(this.appState, 1)
        assert(tab)
        assert.equal(undefined, tab.get('messageBoxDetail'))
      })
    })

    describe('`tabId` does not exist in appState', function () {
      before(function () {
        this.appState = messageBoxState.removeDetail(defaultAppState, {tabId: 1,
          detail: {
            message: 'example message',
            title: 'example title',
            buttons: ['OK'],
            suppress: false,
            showSuppress: false
          }})
      })

      it('returns the unmodified appState', function () {
        let tab = tabState.getByTabId(this.appState, 1)
        assert.equal(null, tab)
      })
    })
  })
})
