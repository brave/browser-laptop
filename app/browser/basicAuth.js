const {app} = require('electron')
const appActions = require('../../js/actions/appActions')
const basicAuthState = require('../common/state/basicAuthState')
const { makeImmutable } = require('../common/state/immutableUtil')

// URLs to callback for auth.
let authCallbacks = {}

const cleanupAuthCallback = (tabId) => {
  delete authCallbacks[tabId]
}

const basicAuth = {
  init: () => {
    app.on('login', (e, webContents, request, authInfo, cb) => {
      e.preventDefault()
      let tabId = webContents.getId()
      authCallbacks[tabId] = cb
      webContents.on('destroyed', () => {
        cleanupAuthCallback(tabId)
      })
      webContents.on('crashed', () => {
        cleanupAuthCallback(tabId)
      })
      setImmediate(() => {
        appActions.setLoginRequiredDetail(tabId, {
          request,
          authInfo
        })
      })
    })
  },

  setLoginResponseDetail: (state, action) => {
    state = makeImmutable(state)
    action = makeImmutable(action)
    let tabId = action.get('tabId')
    let detail = action.get('detail')
    state = basicAuthState.setLoginResponseDetail(state, action)
    let cb = authCallbacks[tabId]
    if (cb) {
      cleanupAuthCallback(tabId)
      if (detail) {
        let username = detail.get('username')
        let password = detail.get('password')
        cb(username, password)
      } else {
        cb()
      }
    }
    return state
  }
}

module.exports = basicAuth
