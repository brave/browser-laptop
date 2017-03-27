const appActions = require('../../js/actions/appActions')
const config = require('../../js/constants/config')
const Immutable = require('immutable')
const tabState = require('../common/state/tabState')
const {app, BrowserWindow, extensions} = require('electron')
const {makeImmutable} = require('../common/state/immutableUtil')
const {getTargetAboutUrl, isSourceAboutUrl, newFrameUrl} = require('../../js/lib/appUrlUtil')
const {isURL, getUrlFromInput} = require('../../js/lib/urlutil')
const {isSessionPartition} = require('../../js/state/frameStateUtil')

let currentWebContents = {}
let currentPartitionNumber = 0
const incrementPartitionNumber = () => ++currentPartitionNumber

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
    tabValue = tabValue.set('guestInstanceId', tab.guestInstanceId)
    return tabValue.set('tabId', tabId)
  }
}

const updateTab = (tabId) => {
  let tabValue = getTabValue(tabId)
  if (tabValue) {
    appActions.tabUpdated(tabValue)
  }
}

/**
 * Obtains the curent partition.
 * Warning: This function has global side effects in that it increments the
 * global next partition number if isPartitioned is passed into the create options.
 */
const getPartition = (createProperties) => {
  let partition = 'persist:default'
  const openerTab = currentWebContents[createProperties.openerTabId]
  if (createProperties.partition) {
    partition = createProperties.partition
  } else if (createProperties.isPrivate) {
    partition = 'default'
  } else if (createProperties.isPartitioned) {
    partition = `persist:partition-${incrementPartitionNumber()}`
  } else if (createProperties.partitionNumber) {
    partition = `persist:partition-${createProperties.partitionNumber}`
  } else if (openerTab) {
    partition = openerTab.session.partition
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
        const hostWebContents = source.hostWebContents || source
        appActions.newWebContentsAdded(hostWebContents.getOwnerBrowserWindow().id, frameOpts)
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
      tab.on('guest-ready', (e, tabId, guestInstanceId) => {
        console.log('app browser tab.js guest-ready', tabId, guestInstanceId)
        appActions.guestReady(tabId, guestInstanceId)
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

  loadURL: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      let url = action.get('url')
      if (isSourceAboutUrl(url)) {
        url = getTargetAboutUrl(url)
      }
      if (isURL(url)) {
        url = getUrlFromInput(url)
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
      let url = action.get('url')
      if (isSourceAboutUrl(url)) {
        url = getTargetAboutUrl(url)
      }
      if (isURL(url)) {
        url = getUrlFromInput(url)
      }
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
      const alreadyPinnedTab = tabState.queryTab(state, { url, pinned: true })
      if (pinned && alreadyPinnedTab) {
        tab.close(tab)
        return tabState.removeTabByTabId(state, tabId)
      }

      console.log('----tab.setPinned:', tabId, pinned)
      tab.setPinned(pinned)
    }
    return state
  },

  closeTab: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const tab = api.getWebContents(tabId)
    try {
      if (!tab.isDestroyed()) {
        tab.close(tab)
      }
    } catch (e) {
      // ignore
    }
    return tabState.removeTabByTabId(state, tabId)
  },

  create: (createProperties, cb = null) => {
    createProperties = makeImmutable(createProperties).toJS()
    if (!createProperties.url) {
      createProperties.url = newFrameUrl()
    }
    if (isSourceAboutUrl(createProperties.url)) {
      createProperties.url = getTargetAboutUrl(createProperties.url)
    }
    if (isURL(createProperties.url)) {
      createProperties.url = getUrlFromInput(createProperties.url)
    }
    const partition = getPartition(createProperties)
    if (partition) {
      createProperties.partition = partition
      if (isSessionPartition(partition)) {
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
    api.create(action.get('createProperties'))
    return state
  },

  maybeCreateTab: (state, action) => {
    action = makeImmutable(action)
    let createProperties = makeImmutable(action.get('createProperties'))
    let url = createProperties.get('url')
    const windowId = createProperties.get('windowId')
    if (isSourceAboutUrl(url)) {
      url = getTargetAboutUrl(url)
      createProperties = createProperties.set('url', url)
    }
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
  },

  attachGuest: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const guestInstanceId = action.get('guestInstanceId')
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      console.log('attaching guest for guestInstanceId: ', guestInstanceId)
      tab.attachGuest(guestInstanceId)
    }
    return state
  },

  detachGuest: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const tab = api.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.detachGuest()
    }
    return state
  },

  transferPins: (state, action) => {
    action = makeImmutable(action)
    const windowId = action.get('windowId')
    console.log('transferPins:', windowId)
    state = state.setIn(['pinnedTabs', 'attachingWindowId'], windowId)
    const pinnedTabs =
      tabState.getTabsByWindowId(state, windowId)
      .filter((tab) => tab.get('pinned'))
    pinnedTabs.forEach((tabValue) => {
      const tabId = tabValue.get('tabId')
      const tabWindowId = tabValue.get('windowId')
      const currentGuestInstanceId = state.getIn(['pinnedTabs', 'attachedState', tabId])
      const targetGuestInstanceId = tabValue.get('guestInstanceId')
      if (windowId !== tabWindowId) {
        if (currentGuestInstanceId) {
          appActions.guestDetached(tabId)
        }
      } else {
        if (targetGuestInstanceId !== currentGuestInstanceId) {
          // TODO: Make guestAttached work when no targetGuestInstanceId exists
          appActions.guestAttached(tabId, targetGuestInstanceId)
        }
      }
    })
    return state
  },

  setTabGuest: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const guestInstanceId = action.get('guestInstanceId')
    const windowId = state.getIn(['pinnedTabs', 'attachingWindowId'])
    console.log('---setTabGuest', tabId, guestInstanceId, windowId)
    state = state.setIn(['pinnedTabs', 'attachedState', tabId], guestInstanceId)

    const pinnedTabs =
      tabState.getPinnedTabs(state)

    const attachedOnOldWindowTabs = pinnedTabs
      .filter((tab) =>
        tab.get('pinned') &&
        tab.get('windowId') !== windowId &&
        state.getIn(['pinnedTabs', 'attachedState', tab.get('tabId')]) === tab.get('guestInstanceId'))
    console.log('setTagGuest, old windows attached tabs: ', attachedOnOldWindowTabs.size)//, attachedOnOldWindowTabs.toJS())

    const pendingCloseWindowId = state.getIn(['pinnedTabs', 'pendingCloseWindowId'])
    if (pendingCloseWindowId) {
      console.log('we want to do a close for pending close window id:', pendingCloseWindowId)

      // Check if all tabs have been transferred
      const targetWindowPinnedTabs =
        pinnedTabs
          .filter((tab) => tab.get('windowId') === windowId && tab.get('pinned'))

      console.log('setTabGuest: pinnedTabs: ', targetWindowPinnedTabs.size)

      const attachedPinnedTabs = targetWindowPinnedTabs
        .filter((tab) =>
          state.getIn(['pinnedTabs', 'attachedState', tab.get('tabId')] === tab.get('guestInstanceId')))
      console.log('setTabGuest: attachedPinnedTabs: ', attachedPinnedTabs.size)

      if (targetWindowPinnedTabs.size === targetWindowPinnedTabs.size) {
        console.log('we have all the pins now close the old window:', pendingCloseWindowId)
        state = state.deleteIn(['pinnedTabs', 'attachingWindowId'])
        api.closeWindow(pendingCloseWindowId)
      }
    }

    return state
  }

}

module.exports = api
