const electron = require('electron')
const app = electron.app
const appActions = require('../../js/actions/appActions')
const appConstants = require('../../js/constants/appConstants')
const appDispatcher = require('../../js/dispatcher/appDispatcher')
const appStore = require('../../js/stores/appStore')

// URLs to callback for auth.
let authCallbacks = {}

const cleanupAuthCallback = (tabId) => {
  delete authCallbacks[tabId]
}

const runAuthCallback = (tabId, detail) => {
  let cb = authCallbacks[tabId]
  if (cb) {
    delete authCallbacks[tabId]
    if (detail) {
      let username = detail.get('username')
      let password = detail.get('password')
      cb(username, password)
    } else {
      cb()
    }
  }
}

const doAction = (action) => {
  switch (action.actionType) {
    case appConstants.APP_SET_LOGIN_RESPONSE_DETAIL:
      appDispatcher.waitFor([appStore.dispatchToken], () => {
        runAuthCallback(action.tabId, action.detail)
      })
      break
    default:
  }
}

const basicAuth = {
  init: () => {
    appDispatcher.register(doAction)
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
      appActions.setLoginRequiredDetail(tabId, {
        request,
        authInfo
      })
    })
  }
}

module.exports = basicAuth
