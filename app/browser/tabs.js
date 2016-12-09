const {app, extensions, webContents} = require('electron')
const appActions = require('../../js/actions/appActions')
const { makeImmutable } = require('../common/state/immutableUtil')
const tabState = require('../common/state/tabState')

let currentWebContents = {}

const cleanupWebContents = (tabId) => {
  delete currentWebContents[tabId]
  setImmediate(() => {
    appActions.tabClosed({ tabId })
  })
}

const getTabValue = function (tabId) {
  let tab = api.getWebContents(tabId)
  if (tab) {
    const tabValue = makeImmutable(extensions.tabValue(tab))
    return tabValue.set('tabId', tabId)
  }
}

const updateTab = (tabId) => {
  let tabValue = getTabValue(tabId)
  if (tabValue) {
    setImmediate(() => {
      appActions.tabUpdated(tabValue)
    })
  }
}

const api = {
  init: (state, action) => {
    process.on('add-new-contents', (e, openerTab, newTab, disposition, userGesture) => {
      if (userGesture === false) {
        e.preventDefault()
      }
    })
    app.on('web-contents-created', function (event, tab) {
      if (extensions.isBackgroundPage(tab) || !tab.isGuest()) {
        return
      }
      let tabId = tab.getId()
      tab.once('destroyed', cleanupWebContents.bind(null, tabId))
      tab.once('crashed', cleanupWebContents.bind(null, tabId))
      tab.once('close', cleanupWebContents.bind(null, tabId))
      tab.on('set-active', function (evt, active) {
        updateTab(tabId)
      })
      tab.on('page-favicon-updated', function (e, favicons) {
        if (favicons && favicons.length > 0) {
          tab.setTabValues({
            faviconUrl: favicons[0]
          })
          updateTab(tabId)
        }
      })
      tab.on('unresponsive', () => {
        console.log('unresponsive')
      })
      tab.on('responsive', () => {
        console.log('responsive')
      })
      tab.on('did-attach', () => {
        updateTab(tabId)
      })
      tab.on('did-detach', () => {
        updateTab(tabId)
      })
      tab.on('page-title-updated', function () {
        updateTab(tabId)
      })
      tab.on('did-fail-load', function () {
        updateTab(tabId)
      })
      tab.on('did-fail-provisional-load', function () {
        updateTab(tabId)
      })
      tab.on('did-stop-loading', function () {
        updateTab(tabId)
      })
      tab.on('navigation-entry-commited', function (evt, url) {
        updateTab(tabId)
      })
      tab.on('did-navigate', function (evt, url) {
        updateTab(tabId)
      })
      tab.on('load-start', function (evt, url, isMainFrame, isErrorPage) {
        if (isMainFrame) {
          updateTab(tabId)
        }
      })
      tab.on('did-finish-load', function () {
        updateTab(tabId)
      })

      currentWebContents[tabId] = tab
      let tabValue = getTabValue(tabId)
      if (tabValue) {
        setImmediate(() => {
          appActions.tabCreated(tabValue)
        })
      }
    })

    return state
  },

  getWebContents: (tabId) => {
    return currentWebContents[tabId]
  },

  setAudioMuted: (state, action) => {
    action = makeImmutable(action)
    let frameProps = action.get('frameProps')
    let muted = action.get('muted')
    let tabId = frameProps.get('tabId')
    let webContents = api.getWebContents(tabId)
    if (webContents) {
      webContents.setAudioMuted(muted)
      let tabValue = getTabValue(tabId)
      return tabState.updateTab(state, { tabValue })
    }
  },

  closeTab: (state, action) => {
    action = makeImmutable(action)
    let tabId = action.get('tabId')
    let tab = api.getWebContents(tabId)
    try {
      if (!tab.isDestroyed()) {
        tab.close()
      }
    } catch (e) {
      // ignore
    }
    return tabState.removeTabByTabId(state, tabId)
  },

  create: (createProperties, cb = null) => {
    createProperties = makeImmutable(createProperties).toJS()
    webContents.createTab(createProperties, (webContents) => {
      cb && cb(webContents)
    })
  }
}

module.exports = api
