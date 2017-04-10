const appActions = require('../../js/actions/appActions')
const config = require('../../js/constants/config')
const Immutable = require('immutable')
const tabState = require('../common/state/tabState')
const {app, BrowserWindow, extensions, session} = require('electron')
const {makeImmutable} = require('../common/state/immutableUtil')
const {getTargetAboutUrl, isSourceAboutUrl, newFrameUrl} = require('../../js/lib/appUrlUtil')
const {isURL, getUrlFromInput} = require('../../js/lib/urlutil')
const {isSessionPartition} = require('../../js/state/frameStateUtil')
const {getOrigin} = require('../../js/state/siteUtil')
const {getSetting} = require('../../js/settings')
const settings = require('../../js/constants/settings')

let currentWebContents = {}
let currentPartitionNumber = 0
const incrementPartitionNumber = () => ++currentPartitionNumber

const cleanupWebContents = (tabId) => {
  if (currentWebContents[tabId]) {
    delete currentWebContents[tabId]
    appActions.tabClosed({ tabId })
  }
}

const normalizeUrl = function (url) {
  if (isSourceAboutUrl(url)) {
    url = getTargetAboutUrl(url)
  }
  if (isURL(url)) {
    url = getUrlFromInput(url)
  }
  return url
}

const getTabValue = function (tabId) {
  let tab = api.getWebContents(tabId)
  if (tab) {
    let tabValue = makeImmutable(tab.tabValue())
    tabValue = tabValue.set('canGoBack', tab.canGoBack())
    tabValue = tabValue.set('canGoForward', tab.canGoForward())
    tabValue = tabValue.set('guestInstanceId', tab.guestInstanceId)
    tabValue = tabValue.set('partition', tab.session.partition)
    tabValue = tabValue.set('partitionNumber', getPartitionNumber(tab.session.partition))
    return tabValue.set('tabId', tabId)
  }
}

const updateTab = (tabId) => {
  let tabValue = getTabValue(tabId)
  if (tabValue) {
    appActions.tabUpdated(tabValue)
  }
}

const getPartitionNumber = (partition) => {
  return Number(partition.split('persist:partition-')[1] || 0)
}

/**
 * Obtains the curent partition.
 * Warning: This function has global side effects in that it increments the
 * global next partition number if isPartitioned is passed into the create options.
 */
const getPartition = (createProperties) => {
  let partition = session.defaultSession.partition
  if (createProperties.partition) {
    partition = createProperties.partition
  } else if (createProperties.isPrivate) {
    partition = 'default'
  } else if (createProperties.isPartitioned) {
    partition = `persist:partition-${incrementPartitionNumber()}`
  } else if (createProperties.partitionNumber) {
    partition = `persist:partition-${createProperties.partitionNumber}`
  }

  return partition
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
      if (newTabValue && parseInt(newTabValue.get('index')) > -1) {
        index = newTabValue.get('index')
      }

      let windowId
      if (newTabValue && parseInt(newTabValue.get('windowId')) > -1) {
        windowId = newTabValue.get('windowId')
      } else {
        const hostWebContents = source.hostWebContents || source
        windowId = hostWebContents.getOwnerBrowserWindow().id
      }

      const frameOpts = {
        location,
        partition: newTab.session.partition,
        openInForeground: newTab.active,
        guestInstanceId: newTab.guestInstanceId,
        isPinned: !!newTabValue.get('pinned'),
        openerTabId,
        disposition,
        index
      }

      if (disposition === 'new-window' || disposition === 'new-popup') {
        const windowOpts = makeImmutable(size)
        appActions.newWindow(makeImmutable(frameOpts), windowOpts)
      } else {
        appActions.newWebContentsAdded(windowId, frameOpts)
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

  setActive: (state, action) => {
    action = makeImmutable(action)
    let frameProps = action.get('frameProps')
    let tabId = frameProps.get('tabId')
    let tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setActive(true)
      let tabValue = getTabValue(tabId)
      return tabState.updateTab(state, { tabValue })
    }
    return state
  },

  loadURL: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      let url = normalizeUrl(action.get('url'))
      // We only allow loading URLs explicitly when the origin is
      // the same for pinned tabs.  This is to help preserve a users
      // pins.
      if (tab.pinned && getOrigin(tab.getURL()) !== getOrigin(url)) {
        api.create({
          url,
          partition: tab.session.partition
        })
        return state
      }

      tab.loadURL(url)
    }
    return state
  },

  loadURLInActiveTab: (state, action) => {
    action = makeImmutable(action)
    const windowId = action.get('windowId')
    const tabValue = tabState.getActiveTabValue(state, windowId)
    const tab = tabValue && api.getWebContents(tabValue.get('tabId'))
    if (tab && !tab.isDestroyed()) {
      const url = normalizeUrl(action.get('url'))
      tab.loadURL(url)
    }
    return state
  },

  setAudioMuted: (state, action) => {
    action = makeImmutable(action)
    const frameProps = action.get('frameProps')
    const muted = action.get('muted')
    const tabId = frameProps.get('tabId')
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setAudioMuted(muted)
      const tabValue = getTabValue(tabId)
      return tabState.updateTab(state, { tabValue })
    }
    return state
  },

  clone: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    let options = action.get('options') || Immutable.Map()
    const tabValue = getTabValue(tabId)
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

  pin: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const pinned = action.get('pinned')
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      const url = tab.getURL()
      // For now we only support 1 tab pin per URL
      const alreadyPinnedTab = tabState.queryTab(state, { url, pinned: true, partition: tab.session.partition })
      if (pinned && alreadyPinnedTab) {
        tab.close(tab)
        return tabState.removeTabByTabId(state, tabId)
      }

      tab.setPinned(pinned)
      state = tabState.updateTabValue(state, getTabValue(tabId))
    }
    return state
  },

  removeTab: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.getIn(['tabValue', 'tabId'])
    const forceClose = action.get('forceClose')
    if (tabId) {
      api.closeTab(tabId, forceClose)
      return tabState.removeTab(state, action)
    }
    return state
  },

  closeTab: (tabId, forceClose) => {
    const tab = api.getWebContents(tabId)
    try {
      if (tab && !tab.isDestroyed()) {
        if (forceClose) {
          tab.forceClose()
        } else {
          tab.close(tab)
        }
      }
    } catch (e) {
      // ignore
    }
  },

  create: (createProperties, cb = null) => {
    createProperties = makeImmutable(createProperties).toJS()
    const switchToNewTabsImmediately = getSetting(settings.SWITCH_TO_NEW_TABS) === true
    if (switchToNewTabsImmediately) {
      createProperties.active = true
    }
    if (!createProperties.url) {
      createProperties.url = newFrameUrl()
    }
    createProperties.url = normalizeUrl(createProperties.url)
    if (!createProperties.openerTabId) {
      createProperties.partition = getPartition(createProperties)
      if (isSessionPartition(createProperties.partition)) {
        createProperties.parent_partition = ''
      }
    }
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
  },

  createTab: (state, action) => {
    action = makeImmutable(action)
    api.create(action.get('createProperties'))
    return state
  },

  moveTo: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const frameOpts = action.get('frameOpts')
    const browserOpts = action.get('browserOpts') || new Immutable.Map()
    // positionByMouseCursor: true
    const windowId = action.get('windowId') || -1
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      const tabValue = getTabValue(tabId)
      const guestInstanceId = tabValue && tabValue.get('guestInstanceId')
      if (guestInstanceId != null) {
        frameOpts.set('guestInstanceId', guestInstanceId)
      }

      const currentWindowId = tabValue && tabValue.get('windowId')
      if (windowId != null && currentWindowId === windowId) {
        return state
      }
      tab.detach(() => {
        if (windowId == null || windowId === -1) {
          appActions.newWindow(makeImmutable(frameOpts), browserOpts)
        } else {
          appActions.newWebContentsAdded(windowId, frameOpts)
        }
      })
    }
    return state
  },

  maybeCreateTab: (state, action) => {
    action = makeImmutable(action)
    let createProperties = makeImmutable(action.get('createProperties'))
    const url = normalizeUrl(createProperties.get('url'))
    createProperties = createProperties.set('url', url)
    const windowId = createProperties.get('windowId')
    const tabData = tabState.getMatchingTab(state, createProperties, windowId, url)
    if (tabData) {
      const tab = api.getWebContents(tabData.get('id'))
      if (tab && !tab.isDestroyed()) {
        tab.setActive(true)
      }
    } else {
      api.createTab(state, action)
    }
    return state
  }
}

module.exports = api
