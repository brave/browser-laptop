const appActions = require('../../js/actions/appActions')
const config = require('../../js/constants/config')
const messages = require('../../js/constants/messages')
const Immutable = require('immutable')
const tabState = require('../common/state/tabState')
const {app, BrowserWindow, extensions} = require('electron')
const { makeImmutable } = require('../common/state/immutableUtil')

let currentWebContents = {}

const cleanupWebContents = (tabId) => {
  if (currentWebContents[tabId]) {
    delete currentWebContents[tabId]
    appActions.tabClosed({ tabId })
  }
}

const getTabValue = function (tabId) {
  let tab = api.getWebContents(tabId)
  if (tab) {
    let tabValue = makeImmutable(tab.tabValue())
    tabValue = tabValue.set('canGoBack', tab.canGoBack())
    tabValue = tabValue.set('canGoForward', tab.canGoForward())
    return tabValue.set('tabId', tabId)
  }
}

const updateTab = (tabId) => {
  let tabValue = getTabValue(tabId)
  if (tabValue) {
    appActions.tabUpdated(tabValue)
  }
}

const api = {
  init: (state, action) => {
    process.on('open-url-from-tab', (e, source, targetUrl, disposition) => {
      api.create({
        url: targetUrl,
        openerTabId: source.getId(),
        active: disposition !== 'background-tab'
      })
    })

    process.on('add-new-contents', (e, source, newTab, disposition, size, userGesture) => {
      if (userGesture === false) {
        e.preventDefault()
        return
      }

      if (newTab.isBackgroundPage()) {
        if (newTab.isDevToolsOpened()) {
          newTab.devToolsWebContents.focus()
        } else {
          newTab.openDevTools()
        }
        return
      }

      let location = newTab.getURL()
      if (!location || location === '') {
        location = 'about:blank'
      }

      const openerTabId = !source.isDestroyed() ? source.getId() : -1
      let newTabValue = getTabValue(newTab.getId())
      let index
      if (newTabValue && newTabValue.get('index') !== -1) {
        index = newTabValue.get('index')
      }

      // TODO(bridiver) - handle pinned property?? - probably through tabValue
      const frameOpts = {
        location,
        partition: newTab.session.partition,
        guestInstanceId: newTab.guestInstanceId,
        openerTabId,
        disposition,
        index
      }

      if (disposition === 'new-window' || disposition === 'new-popup') {
        const windowOpts = makeImmutable(size)
        appActions.newWindow(makeImmutable(frameOpts), windowOpts)
      } else {
        let hostWebContents = source.hostWebContents || source
        hostWebContents.send(messages.SHORTCUT_NEW_FRAME, location, { frameOpts })
      }
    })

    process.on('chrome-tabs-created', (tabId) => {
      updateTab(tabId)
    })

    process.on('chrome-tabs-updated', (tabId) => {
      updateTab(tabId)
    })

    process.on('chrome-tabs-removed', (tabId) => {
      cleanupWebContents(tabId)
    })

    app.on('web-contents-created', function (event, tab) {
      if (tab.isBackgroundPage() || !tab.isGuest()) {
        return
      }
      let tabId = tab.getId()

      tab.once('destroyed', cleanupWebContents.bind(null, tabId))
      tab.once('crashed', cleanupWebContents.bind(null, tabId))
      tab.once('close', cleanupWebContents.bind(null, tabId))
      tab.on('page-favicon-updated', function (e, favicons) {
        if (favicons && favicons.length > 0) {
          // tab.setTabValues({
          //   faviconUrl: favicons[0]
          // })
          // updateTabDebounce(tabId)
        }
      })
      tab.on('unresponsive', () => {
        console.log('unresponsive')
      })
      tab.on('responsive', () => {
        console.log('responsive')
      })

      currentWebContents[tabId] = tab
      let tabValue = getTabValue(tabId)
      if (tabValue) {
        appActions.tabCreated(tabValue)
      }
    })

    process.on('on-tab-created', (tab, options) => {
      if (tab.isDestroyed()) {
        return
      }

      if (options.index !== undefined) {
        tab.setTabIndex(options.index)
      }

      tab.once('did-attach', () => {
        if (options.back) {
          tab.goBack()
        } else if (options.forward) {
          tab.goForward()
        }
      })
    })

    return state
  },

  sendToAll: (...args) => {
    for (let tabId in currentWebContents) {
      const tab = currentWebContents[tabId]
      try {
        if (tab && !tab.isDestroyed()) {
          tab.send(...args)
        }
      } catch (e) {
        // ignore exceptions
      }
    }
  },

  getWebContents: (tabId) => {
    return currentWebContents[tabId]
  },

  toggleDevTools: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      if (tab.isDevToolsOpened()) {
        tab.closeDevTools()
      } else {
        tab.openDevTools()
      }
    }
    return state
  },

  setAudioMuted: (state, action) => {
    action = makeImmutable(action)
    let frameProps = action.get('frameProps')
    let muted = action.get('muted')
    let tabId = frameProps.get('tabId')
    let tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setAudioMuted(muted)
      let tabValue = getTabValue(tabId)
      return tabState.updateTab(state, { tabValue })
    }
    return state
  },

  clone: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    let options = action.get('options') || Immutable.Map()
    let tabValue = getTabValue(tabId)
    if (tabValue && tabValue.get('index') !== undefined) {
      options = options.set('index', tabValue.get('index') + 1)
    }
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.clone(options.toJS(), (newTab) => {
      })
    }
    return state
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
    extensions.createTab(createProperties, (tab) => {
      cb && cb(tab)
    })
  },

  executeScriptInBackground: (script, cb) => {
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        partition: 'default'
      }
    })
    win.webContents.on('did-finish-load', (e) => {
      win.webContents.executeScriptInTab(config.braveExtensionId, script, {}, (err, url, result) => {
        cb(err, url, result)
        setImmediate(() => win.close())
      })
    })
    win.loadURL('about:blank')
  }
}

module.exports = api
