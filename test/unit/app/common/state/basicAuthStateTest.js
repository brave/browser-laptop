/* global describe, it, before */
const basicAuthState = require('../../../../../app/common/state/basicAuthState')
const tabState = require('../../../../../app/common/state/tabState')
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

const defaultTab = Immutable.fromJS({
  tabId: defaultTabId,
  windowId: 1,
  windowUUID: 'uuid',
  loginRequiredDetail: {
    request: { url: 'someurl' },
    authInfo: { authInfoProp: 'value' }
  }
})

describe('basicAuthState unit tests', function () {
  describe('setLoginResponseDetail', function () {
    describe('`tabId` exists in appState with loginRequiredDetail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.appState = basicAuthState.setLoginResponseDetail(this.appState, {tabId: defaultTabId,
          detail: {
            username: 'username',
            password: 'password'
          }})
      })

      it('removes the login detail', function () {
        let tab = tabState.getByTabId(this.appState, defaultTabId)
        assert(tab)
        assert.equal(undefined, tab.get('loginRequiredDetail'))
      })
    })

    describe('`tabId` exists in appState with no loginRequiredDetail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([{ tabId: defaultTabId }]))
        this.appState = basicAuthState.setLoginResponseDetail(this.appState, {tabId: defaultTabId,
          detail: {
            username: 'username',
            password: 'password'
          }})
      })

      it('returns the unmodified appState', function () {
        let tab = tabState.getByTabId(this.appState, defaultTabId)
        assert(tab)
        assert.equal(undefined, tab.get('loginRequiredDetail'))
      })
    })

    describe('`tabId` does not exist in appState', function () {
      before(function () {
        this.appState = basicAuthState.setLoginResponseDetail(defaultAppState, {tabId: defaultTabId,
          detail: {
            username: 'username',
            password: 'password'
          }})
      })

      it('returns the unmodified appState', function () {
        let tab = tabState.getByTabId(this.appState, defaultTabId)
        assert.equal(null, tab)
      })
    })
  })

  describe('setLoginRequiredDetail', function () {
    it('error for missing required fields')

    describe('with null detail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.appState = basicAuthState.setLoginRequiredDetail(this.appState, {tabId: defaultTabId})
      })

      it('removes the login detail', function () {
        let tab = tabState.getByTabId(this.appState, defaultTabId)
        assert(tab)
        assert.equal(undefined, tab.get('loginRequiredDetail'))
      })
    })

    describe('with empty detail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.appState = basicAuthState.setLoginRequiredDetail(this.appState, {tabId: defaultTabId, detail: {}})
      })

      it('removes the login detail', function () {
        let tab = tabState.getByTabId(this.appState, defaultTabId)
        assert(tab)
        assert.equal(undefined, tab.get('loginRequiredDetail'))
      })
    })

    describe('`tabId` exists in appState', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([
          {
            tabId: defaultTabId
          }
        ]))
        this.appState = basicAuthState.setLoginRequiredDetail(this.appState, {tabId: defaultTabId,
          detail: {
            request: { url: 'someurl' },
            authInfo: { authInfoProp: 'value' }
          }})
      })

      it('sets the login detail for `tabId` in the appState', function () {
        let tab = tabState.getByTabId(this.appState, defaultTabId)
        assert(tab)
        let loginRequiredDetail = tab.get('loginRequiredDetail')
        assert.equal('someurl', loginRequiredDetail.getIn(['request', 'url']))
        assert.equal('value', loginRequiredDetail.getIn(['authInfo', 'authInfoProp']))
      })
    })

    describe('`tabId` does not exist in appState', function () {
      before(function () {
        this.appState = basicAuthState.setLoginRequiredDetail(defaultAppState, {tabId: defaultTabId,
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

  describe('getLoginRequiredDetail', function () {
    describe('`tabId` exists in appState with loginRequiredDetail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([defaultTab]))
        this.loginRequiredDetail = basicAuthState.getLoginRequiredDetail(this.appState, defaultTabId)
      })

      it('returns the login detail for `tabId`', function () {
        assert.equal('someurl', this.loginRequiredDetail.getIn(['request', 'url']))
        assert.equal('value', this.loginRequiredDetail.getIn(['authInfo', 'authInfoProp']))
      })
    })

    describe('`tabId` exists in appState with no loginRequiredDetail', function () {
      before(function () {
        this.appState = defaultAppState.set('tabs', Immutable.fromJS([
          {
            tabId: defaultTabId
          }
        ]))
        this.loginRequiredDetail = basicAuthState.getLoginRequiredDetail(this.appState, defaultTabId)
      })

      it('returns null', function () {
        assert.equal(null, this.loginRequiredDetail)
      })
    })

    describe('`tabId` does not exist in appState', function () {
      before(function () {
        this.loginRequiredDetail = basicAuthState.getLoginRequiredDetail(defaultAppState, defaultTabId)
      })

      it('returns null', function () {
        assert.equal(null, this.loginRequiredDetail)
      })
    })
  })
})
