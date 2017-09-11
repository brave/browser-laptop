/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appActions = require('../../js/actions/appActions')
const windowActions = require('../../js/actions/windowActions')
const tabActions = require('../common/actions/tabActions')
const config = require('../../js/constants/config')
const Immutable = require('immutable')
const tabState = require('../common/state/tabState')
const windowState = require('../common/state/windowState')
const {app, BrowserWindow, extensions, session, ipcMain} = require('electron')
const {makeImmutable} = require('../common/state/immutableUtil')
const {getTargetAboutUrl, getSourceAboutUrl, isSourceAboutUrl, newFrameUrl, isTargetAboutUrl, isIntermediateAboutPage, isTargetMagnetUrl, getSourceMagnetUrl} = require('../../js/lib/appUrlUtil')
const {isURL, getUrlFromInput, toPDFJSLocation, getDefaultFaviconUrl, isHttpOrHttps, getLocationIfPDF} = require('../../js/lib/urlutil')
const {isSessionPartition} = require('../../js/state/frameStateUtil')
const {getOrigin} = require('../../js/state/siteUtil')
const {getSetting} = require('../../js/settings')
const settings = require('../../js/constants/settings')
const {getBaseUrl, aboutUrls} = require('../../js/lib/appUrlUtil')
const siteSettings = require('../../js/state/siteSettings')
const messages = require('../../js/constants/messages')
const aboutHistoryState = require('../common/state/aboutHistoryState')
const appStore = require('../../js/stores/appStore')
const appConfig = require('../../js/constants/appConfig')
const siteTags = require('../../js/constants/siteTags')
const {newTabMode} = require('../common/constants/settingsEnums')
const {tabCloseAction} = require('../common/constants/settingsEnums')
const {cleanupWebContents, currentWebContents, getWebContents, updateWebContents} = require('./webContentsCache')
const {FilterOptions} = require('ad-block')
const {isResourceEnabled} = require('../filtering')
const autofill = require('../autofill')

let currentPartitionNumber = 0
const incrementPartitionNumber = () => ++currentPartitionNumber

const normalizeUrl = function (url) {
  if (isSourceAboutUrl(url)) {
    url = getTargetAboutUrl(url)
  }
  if (isURL(url)) {
    url = getUrlFromInput(url)
  }
  if (getSetting(settings.PDFJS_ENABLED)) {
    url = toPDFJSLocation(url)
  }
  return url
}

const getTabValue = function (tabId) {
  let tab = getWebContents(tabId)
  if (tab && !tab.isDestroyed()) {
    let tabValue = makeImmutable(tab.tabValue())
    tabValue = tabValue.set('canGoBack', tab.canGoBack())
    tabValue = tabValue.set('canGoForward', tab.canGoForward())
    tabValue = tabValue.set('guestInstanceId', tab.guestInstanceId)
    tabValue = tabValue.set('partition', tab.session.partition)
    tabValue = tabValue.set('partitionNumber', getPartitionNumber(tab.session.partition))
    return tabValue.set('tabId', tabId)
  }
}

const updateTab = (tabId, changeInfo = {}) => {
  let tabValue = getTabValue(tabId)
  if (tabValue) {
    appActions.tabUpdated(tabValue, makeImmutable(changeInfo))
  }
}

const getPartitionNumber = (partition) => {
  return Number(partition.split('persist:partition-')[1] || 0)
}

/**
 * Obtains the current partition.
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

const needsPartitionAssigned = (createProperties) => {
  return !createProperties.openerTabId ||
    createProperties.isPrivate ||
    createProperties.isPartitioned ||
    createProperties.partitionNumber ||
    createProperties.partition
}

const isAutoDiscardable = (createProperties) => {
  if (createProperties.pinned) {
    return false
  }

  return isHttpOrHttps(createProperties.url)
}

// TODO(bridiver) - refactor this into an action
ipcMain.on(messages.ABOUT_COMPONENT_INITIALIZED, (e) => {
  const tab = e.sender
  const listener = (_diffs) => {
    if (!tab.isDestroyed()) {
      const tabValue = tabState.getByTabId(appStore.getState(), tab.getId())
      if (tabValue && tabValue.get('active') === true) {
        updateAboutDetails(tab, tabValue)
      }
    } else {
      appStore.removeChangeListener(listener)
    }
  }
  listener()

  appStore.addChangeListener(listener)
  tab.on('set-active', (evt, active) => {
    if (active) {
      listener()
    }
  })
  tab.on('destroyed', () => {
    appStore.removeChangeListener(listener)
  })
  tab.on('did-navigate', () => {
    appStore.removeChangeListener(listener)
  })
})

const getBookmarksData = function (state) {
  let bookmarkSites = new Immutable.OrderedMap()
  let bookmarkFolderSites = new Immutable.OrderedMap()
  state.get('sites').forEach((site, siteKey) => {
    const tags = site.get('tags')
    if (tags) {
      if (tags.includes(siteTags.BOOKMARK)) {
        bookmarkSites = bookmarkSites.set(siteKey, site)
      }
      if (tags.includes(siteTags.BOOKMARK_FOLDER)) {
        bookmarkFolderSites = bookmarkFolderSites.set(siteKey, site)
      }
    }
  })
  const bookmarks = bookmarkSites.toList().toJS()
  const bookmarkFolders = bookmarkFolderSites.toList().toJS()
  return {bookmarks, bookmarkFolders}
}

const updateAboutDetails = (tab, tabValue) => {
  const appState = appStore.getState()
  const url = getSourceAboutUrl(tab.getURL())
  let location = getBaseUrl(url)

  // TODO(bridiver) - refactor these to use state helpers
  const ledgerInfo = appState.get('ledgerInfo')
  const publisherInfo = appState.get('publisherInfo')
  const preferencesData = appState.getIn(['about', 'preferences'])
  const appSettings = appState.get('settings')
  let allSiteSettings = appState.get('siteSettings')
  if (tabValue.get('incognito') === true) {
    allSiteSettings = allSiteSettings.mergeDeep(appState.get('temporarySiteSettings'))
  }
  const extensionsValue = appState.get('extensions')
  const sync = appState.get('sync')
  const braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)
  const history = aboutHistoryState.getHistory(appState)
  const adblock = appState.get('adblock')
  const downloads = appState.get('downloads')
  const trackedBlockersCount = appState.getIn(['trackingProtection', 'count'])
  const adblockCount = appState.getIn(['adblock', 'count'])
  const httpsUpgradedCount = appState.getIn(['httpsEverywhere', 'count'])
  const newTabDetail = appState.getIn(['about', 'newtab'])
  const autofillCreditCards = appState.getIn(['autofill', 'creditCards'])
  const autofillAddresses = appState.getIn(['autofill', 'addresses'])
  const versionInformation = appState.getIn(['about', 'brave', 'versionInformation'])
  const aboutDetails = tabValue.get('aboutDetails')
  // TODO(bridiver) - convert this to an action
  if (url === 'about:preferences#payments') {
    tab.on('destroyed', () => {
      process.emit(messages.LEDGER_PAYMENTS_PRESENT, tabValue.get('tabId'), false)
    })
    process.emit(messages.LEDGER_PAYMENTS_PRESENT, tabValue.get('tabId'), true)
  } else {
    process.emit(messages.LEDGER_PAYMENTS_PRESENT, tabValue.get('tabId'), false)
  }
  if (location === 'about:preferences' || location === 'about:contributions' || location === aboutUrls.get('about:contributions')) {
    const ledgerData = ledgerInfo.merge(publisherInfo).merge(preferencesData)
    tab.send(messages.LEDGER_UPDATED, ledgerData.toJS())
    tab.send(messages.SETTINGS_UPDATED, appSettings.toJS())
    tab.send(messages.SITE_SETTINGS_UPDATED, allSiteSettings.toJS())
    tab.send(messages.SYNC_UPDATED, sync.toJS())
    tab.send(messages.BRAVERY_DEFAULTS_UPDATED, braveryDefaults)
    tab.send(messages.EXTENSIONS_UPDATED, extensionsValue.toJS())
  } else if (location === 'about:bookmarks') {
    const bookmarksData = getBookmarksData(appState)
    if (bookmarksData.bookmarks) {
      const handle = muon.shared_memory.create(bookmarksData)
      tab.sendShared(messages.BOOKMARKS_UPDATED, handle)
    }
  } else if (location === 'about:history') {
    if (!history) {
      appActions.populateHistory()
    } else {
      const handle = muon.shared_memory.create(history.toJS())
      tab.sendShared(messages.HISTORY_UPDATED, handle)
    }
    tab.send(messages.SETTINGS_UPDATED, appSettings.toJS())
  } else if (location === 'about:extensions' && extensions) {
    tab.send(messages.EXTENSIONS_UPDATED, extensionsValue.toJS())
  } else if (location === 'about:adblock' && adblock) {
    tab.send(messages.ADBLOCK_UPDATED, {
      adblock: adblock.toJS(),
      settings: appSettings.toJS(),
      resources: require('ad-block/lib/regions')
    })
  } else if (location === 'about:downloads' && downloads) {
    tab.send(messages.DOWNLOADS_UPDATED, {
      downloads: downloads.toJS()
    })
  } else if (location === 'about:passwords') {
    autofill.getAutofillableLogins(tab)
    autofill.getBlackedlistLogins(tab)
  } else if (location === 'about:flash') {
    tab.send(messages.BRAVERY_DEFAULTS_UPDATED, braveryDefaults.toJS())
  } else if (location === 'about:newtab') {
    const showEmptyPage = getSetting(settings.NEWTAB_MODE) === newTabMode.EMPTY_NEW_TAB ||
          // TODO: This can be removed once we're on muon 2.57.8 or above
          tabValue.get('incognito') === true
    const showImages = getSetting(settings.SHOW_DASHBOARD_IMAGES) && !showEmptyPage
    tab.send(messages.NEWTAB_DATA_UPDATED, {
      showEmptyPage,
      showImages,
      trackedBlockersCount,
      adblockCount,
      httpsUpgradedCount,
      newTabDetail: newTabDetail && newTabDetail.toJS()
    })
  } else if (location === 'about:autofill') {
    const defaultSession = session.defaultSession
    {
      const guids = autofillAddresses.get('guid')
      let list = []
      guids.forEach((entry) => {
        const address = defaultSession.autofill.getProfile(entry)
        let addressDetail = {
          name: address.full_name,
          organization: address.company_name,
          streetAddress: address.street_address,
          city: address.city,
          state: address.state,
          postalCode: address.postal_code,
          country: address.country_code,
          phone: address.phone,
          email: address.email,
          guid: entry
        }
        list.push(addressDetail)
      })
      tab.send(messages.AUTOFILL_ADDRESSES_UPDATED, list)
    }
    {
      const guids = autofillCreditCards.get('guid')
      let list = []
      guids.forEach((entry) => {
        const creditCard = defaultSession.autofill.getCreditCard(entry)
        let creditCardDetail = {
          name: creditCard.name,
          card: creditCard.card_number,
          month: creditCard.expiration_month,
          year: creditCard.expiration_year,
          guid: entry
        }
        list.push(creditCardDetail)
      })
      tab.send(messages.AUTOFILL_CREDIT_CARDS_UPDATED, list)
    }
  } else if (location === 'about:brave') {
    tab.send(messages.VERSION_INFORMATION_UPDATED, versionInformation.toJS())
  }
  // send state to about pages
  if (aboutUrls.get(location) && aboutDetails) {
    tab.send(messages.STATE_UPDATED, aboutDetails.toJS())
  }
}

// hack to deal with about:* pages
const fixDisplayURL = (navigationEntry, controller) => {
  if (navigationEntry == null) {
    return null
  }

  navigationEntry = Object.assign({}, navigationEntry)

  navigationEntry.virtualURL = getLocationIfPDF(navigationEntry.virtualURL)

  if (isTargetAboutUrl(navigationEntry.virtualURL)) {
    navigationEntry.virtualURL = getSourceAboutUrl(navigationEntry.virtualURL)
  }

  if (isIntermediateAboutPage(navigationEntry.virtualURL) &&
    !navigationEntry.virtualURL.startsWith('about:safebrowsing#')) {
    const previousEntry = controller.getEntryAtOffset(-1)
    if (!controller.canGoForward() && previousEntry) {
      navigationEntry.virtualURL = previousEntry.virtualURL
    }
  }

  if (isTargetMagnetUrl(navigationEntry.virtualURL)) {
    navigationEntry.virtualURL = getSourceMagnetUrl(navigationEntry.virtualURL)
  }

  if (navigationEntry.virtualURL === 'about:newtab') {
    navigationEntry.virtualURL = ''
  }

  navigationEntry.virtualURL = muon.url.formatForDisplay(navigationEntry.virtualURL)

  const parsedURL = muon.url.parse(navigationEntry.virtualURL)
  navigationEntry = Object.assign(parsedURL, navigationEntry)

  return navigationEntry
}

const createNavigationState = (navigationHandle, controller) => {
  return Immutable.Map({
    hasCommitted: navigationHandle.hasCommitted(),
    isErrorPage: navigationHandle.isErrorPage(),
    netErrorCode: navigationHandle.getNetErrorCode(),
    activeEntry: fixDisplayURL(controller.getActiveEntry(), controller),
    visibleEntry: fixDisplayURL(controller.getVisibleEntry(), controller),
    lastCommittedEntry: fixDisplayURL(controller.getLastCommittedEntry(), controller),
    pendingEntry: fixDisplayURL(controller.getPendingEntry(), controller),
    canGoBack: controller.canGoBack(),
    canGoForward: controller.canGoForward()
  })
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

      let displayURL = newTab.getURL()
      let location = displayURL || 'about:blank'
      const openerTabId = !source.isDestroyed() ? source.getId() : -1

      let rendererInitiated = false
      if (source.isGuest()) {
        rendererInitiated = true
      }

      const tabId = newTab.getId()
      updateWebContents(tabId, newTab)
      let newTabValue = getTabValue(newTab.getId())

      let windowId
      if (newTabValue && parseInt(newTabValue.get('windowId')) > -1) {
        windowId = newTabValue.get('windowId')
      } else {
        const hostWebContents = source.hostWebContents || source
        windowId = hostWebContents.getOwnerBrowserWindow().id
      }

      let index
      if (parseInt(newTabValue.get('index')) > -1) {
        index = newTabValue.get('index')
      }

      const frameOpts = {
        location,
        displayURL,
        rendererInitiated,
        partition: newTab.session.partition,
        active: !!newTabValue.get('active'),
        guestInstanceId: newTab.guestInstanceId,
        isPinned: !!newTabValue.get('pinned'),
        openerTabId,
        disposition,
        index,
        tabId,
        unloaded: !!newTabValue.get('discarded')
      }

      appActions.tabCreated(newTabValue)

      if (disposition === 'new-window' || disposition === 'new-popup') {
        const windowOpts = makeImmutable(size)
        appActions.newWindow(makeImmutable(frameOpts), windowOpts)
      } else {
        // TODO(bridiver) - use tabCreated in place of newWebContentsAdded
        appActions.newWebContentsAdded(windowId, frameOpts, newTabValue)
      }
    })

    process.on('chrome-tabs-created', (tabId) => {
      updateTab(tabId)
    })

    process.on('chrome-tabs-updated', (tabId, changeInfo) => {
      updateTab(tabId, changeInfo)
    })

    process.on('chrome-tabs-removed', (tabId, windowId) => {
      appActions.tabClosed(tabId, windowId)
      cleanupWebContents(tabId)
    })

    app.on('web-contents-created', function (event, tab) {
      if (tab.isBackgroundPage() || !tab.isGuest()) {
        return
      }
      const tabId = tab.getId()
      tab.on('did-start-navigation', (e, navigationHandle) => {
        if (!tab.isDestroyed() && navigationHandle.isValid() && navigationHandle.isInMainFrame()) {
          const controller = tab.controller()
          if (!controller.isValid()) {
            return
          }
          let tabValue = getTabValue(tabId)
          if (tabValue) {
            const windowId = tabValue.get('windowId')
            tabActions.didStartNavigation(tabId, createNavigationState(navigationHandle, controller), windowId)
          }
        }
      })

      tab.on('did-finish-navigation', (e, navigationHandle) => {
        if (!tab.isDestroyed() && navigationHandle.isValid() && navigationHandle.isInMainFrame()) {
          const controller = tab.controller()
          if (!controller.isValid()) {
            return
          }
          let tabValue = getTabValue(tabId)
          if (tabValue) {
            const windowId = tabValue.get('windowId')
            tabActions.didFinishNavigation(tabId, createNavigationState(navigationHandle, controller), windowId)
          }
        }
      })

      tab.on('close', () => {
        tab.forceClose()
      })

      tab.on('unresponsive', () => {
        console.log('unresponsive')
      })

      tab.on('responsive', () => {
        console.log('responsive')
      })

      tab.on('tab-changed-at', () => {
        updateTab(tabId)
      })

      tab.on('tab-moved', () => {
        appActions.tabMoved(tabId)
      })

      tab.on('will-attach', () => {
        appActions.tabWillAttach(tab.getId())
      })

      tab.on('tab-strip-empty', () => {
        // It's only safe to close a window when the last web-contents tab has been
        // re-attached.  A detach which already happens by this point is not enough.
        // Otherwise the closing window will destroy the tab web-contents and it'll
        // lead to a dead tab.  The destroy will happen because the old main window
        // webcontents is still the embedder.
        const tabValue = getTabValue(tabId)
        const windowId = tabValue.get('windowId')
        tab.once('did-attach', () => {
          appActions.tabStripEmpty(windowId)
        })
      })

      tab.on('did-attach', () => {
        appActions.tabAttached(tab.getId())
      })

      tab.on('save-password', (e, username, origin) => {
        appActions.savePassword(username, origin, tabId)
      })

      tab.on('update-password', (e, username, origin) => {
        appActions.updatePassword(username, origin, tabId)
      })

      tab.on('did-get-response-details', (evt, status, newURL, originalURL, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
        if (resourceType === 'mainFrame') {
          windowActions.gotResponseDetails(tabId, {status, newURL, originalURL, httpResponseCode, requestMethod, referrer, headers, resourceType})
        }
      })
    })

    process.on('on-tab-created', (tab, options) => {
      if (tab.isDestroyed()) {
        return
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

  toggleDevTools: (tabId) => {
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      if (tab.isDevToolsOpened()) {
        tab.closeDevTools()
      } else {
        tab.openDevTools()
      }
    }
  },

  setActive: (tabId) => {
    let tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setActive(true)
    }
  },

  setTabIndex: (tabId, index) => {
    let tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setTabIndex(index)
    }
  },

  reload: (tabId, ignoreCache = false) => {
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      // TODO(bridiver) - removeEntryAtIndex for intermediate about pages after loading
      if (isIntermediateAboutPage(getSourceAboutUrl(tab.getURL()))) {
        tab.goToOffset(-1)
      } else {
        tab.reload(ignoreCache)
      }
    }
  },

  loadURL: (action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const tab = getWebContents(tabId)
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
        return
      }

      tab.loadURL(url)
    }
  },

  loadURLInActiveTab: (state, windowId, url) => {
    const tabValue = tabState.getActiveTab(state, windowId)
    if (tabValue) {
      api.loadURLInTab(state, tabValue.get('tabId'), url)
    }
  },

  loadURLInTab: (state, tabId, url) => {
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      url = normalizeUrl(url)
      tab.loadURL(url)
    }
    return state
  },

  setAudioMuted: (action) => {
    action = makeImmutable(action)
    const muted = action.get('muted')
    const tabId = action.get('tabId')
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setAudioMuted(muted)
    }
  },

  clone: (action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    let options = action.get('options') || Immutable.Map()
    const tabValue = getTabValue(tabId)
    if (tabValue) {
      const index = tabValue.get('index')
      if (index !== undefined) {
        options = options.set('index', index + 1)
      }
    }
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.clone(options.toJS(), (newTab) => {
      })
    }
  },

  pin: (state, tabId, pinned) => {
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      const url = tab.getURL()
      // For now we only support 1 tab pin per URL
      const alreadyPinnedTab = tabState.queryTab(state, { url, pinned: true, partition: tab.session.partition })
      if (pinned && alreadyPinnedTab) {
        api.closeTab(tabId)
        return state
      }

      tab.setPinned(pinned)
      state = api.updateTabsStateForAttachedTab(state, tabId)
    }
    return state
  },

  isDevToolsFocused: (tabId) => {
    const tab = getWebContents(tabId)
    return tab &&
      !tab.isDestroyed() &&
      tab.isDevToolsOpened() &&
      tab.isDevToolsFocused()
  },

  closeTab: (tabId, forceClosePinned = false) => {
    const tabValue = getTabValue(tabId)
    if (!tabValue) {
      return false
    }
    const tab = getWebContents(tabId)
    try {
      if (tab && !tab.isDestroyed()) {
        if (tabValue.get('pinned') && !forceClosePinned) {
          tab.hostWebContents.send(messages.SHORTCUT_NEXT_TAB)
          return false
        } else {
          tab.forceClose()
        }
      }
    } catch (e) {
      return false
    }
    return true
  },

  create: (createProperties, cb = null, isRestore = false) => {
    setImmediate(() => {
      const {safeBrowsingInstance} = require('../adBlock')
      createProperties = makeImmutable(createProperties).toJS()

      // handle deprecated `location` property
      if (createProperties.location) {
        console.warn('Using `location` in createProperties is deprecated. Please use `url` instead')
        createProperties.url = createProperties.location
        delete createProperties.location
      }
      const switchToNewTabsImmediately = getSetting(settings.SWITCH_TO_NEW_TABS) === true
      if (!isRestore && switchToNewTabsImmediately) {
        createProperties.active = true
      }
      if (!createProperties.url) {
        createProperties.url = newFrameUrl()
      }
      createProperties.url = normalizeUrl(createProperties.url)
      // TODO(bridiver) - this should be in filtering
      if (isResourceEnabled('safeBrowsing', createProperties.url, createProperties.isPrivate) &&
        safeBrowsingInstance &&
        safeBrowsingInstance.matches(createProperties.url, FilterOptions.document, muon.url.parse(createProperties.url).host)) {
        // Workaround #9056 by setting URL to the safebrowsing URL
        createProperties.url = getTargetAboutUrl('about:safebrowsing#' + createProperties.url)
      }
      if (needsPartitionAssigned(createProperties)) {
        createProperties.partition = getPartition(createProperties)
        if (isSessionPartition(createProperties.partition)) {
          createProperties.parent_partition = ''
        }
      }
      if (!isAutoDiscardable(createProperties)) {
        createProperties.discarded = false
        createProperties.autoDiscardable = false
      }
      extensions.createTab(createProperties, (tab) => {
        cb && cb(tab)
      })
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

  moveTo: (state, tabId, frameOpts, browserOpts, toWindowId) => {
    frameOpts = makeImmutable(frameOpts)
    browserOpts = makeImmutable(browserOpts)
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      const tabValue = getTabValue(tabId)
      const guestInstanceId = tabValue && tabValue.get('guestInstanceId')
      if (guestInstanceId != null) {
        frameOpts.set('guestInstanceId', guestInstanceId)
      }

      const currentWindowId = tabValue && tabValue.get('windowId')
      if (toWindowId != null && currentWindowId === toWindowId) {
        return
      }

      if (toWindowId == null || toWindowId === -1) {
        // If there's only one tab and we're dragging outside the window, then disallow
        // a new window to be created.
        const windowTabCount = tabState.getTabsByWindowId(state, currentWindowId).size
        if (windowTabCount === 1) {
          return
        }
      }

      if (tabValue.get('pinned')) {
        // If the current tab is pinned, then don't allow to drag out
        return
      }
      const nextActiveTabIdForOldWindow = api.getNextActiveTab(state, tabId)
      tab.detach(() => {
        if (toWindowId == null || toWindowId === -1) {
          frameOpts = frameOpts.set('index', 0)
          appActions.newWindow(frameOpts, browserOpts)
        } else {
          appActions.newWebContentsAdded(toWindowId, frameOpts, tabValue)
        }

        // Setting the next active tab for the old window must happen after re-attach of the new tab.
        // This is because muon's tab_strip index for the tab would not be consistent with browser-laptop's
        // expectation and it would try to set an invalid index as active, possibly leaivng nothing active.
        tab.once('did-attach', () => {
          if (nextActiveTabIdForOldWindow !== tabState.TAB_ID_NONE) {
            api.setActive(nextActiveTabIdForOldWindow)
          }
          const index = frameOpts.get('index')
          if (index !== undefined) {
            api.setTabIndex(tabId, frameOpts.get('index'))
          }
        })
      })
    }
  },

  maybeCreateTab: (state, createProperties) => {
    createProperties = makeImmutable(createProperties)
    const url = normalizeUrl(createProperties.get('url'))
    createProperties = createProperties.set('url', url)
    const windowId = createProperties.get('windowId')
    if (!windowId) {
      return
    }
    const tabData = tabState.getMatchingTab(state, createProperties, windowId, url)
    if (tabData) {
      api.setActive(tabData.get('id'))
    } else {
      api.create(createProperties)
    }
  },

  setWebRTCIPHandlingPolicy: (tabId, policy) => {
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setWebRTCIPHandlingPolicy(policy)
    }
  },

  goBack: (tabId) => {
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      // TODO(bridiver) - removeEntryAtIndex for intermediate about pages after loading
      if (tab.controller().canGoToOffset(-2) && isIntermediateAboutPage(getSourceAboutUrl(tab.getURL()))) {
        tab.goToOffset(-2)
      } else if (tab.controller().canGoBack()) {
        tab.goBack()
      }
    }
  },

  goForward: (tabId) => {
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed() && tab.canGoForward()) {
      tab.goForward()
    }
  },

  goToIndex: (tabId, index) => {
    const tab = getWebContents(tabId)
    const validIndex = index >= 0 && index < tab.getEntryCount()
    if (tab && !tab.isDestroyed() && validIndex) {
      tab.goToIndex(index)
    }
  },

  getHistoryEntries: (state, action) => {
    const tab = getWebContents(action.get('tabId'))
    const sites = state ? state.get('sites') : null

    if (tab && !tab.isDestroyed()) {
      let history = {
        count: tab.getEntryCount(),
        currentIndex: tab.getCurrentEntryIndex(),
        entries: []
      }

      for (let index = 0; index < history.count; index++) {
        const url = tab.getURLAtIndex(index)
        const title = tab.getTitleAtIndex(index)

        let entry = {
          index: index,
          url: url,
          display: title || url,
          icon: null
        }

        if (isTargetAboutUrl(url)) {
          // TODO: return brave lion (or better: get icon from extension if possible as data URI)
        } else {
          if (sites) {
            const site = sites.find(function (element) { return element.get('location') === url })
            if (site) {
              entry.icon = site.get('favicon')
            }
          }

          if (!entry.icon) {
            entry.icon = getDefaultFaviconUrl(url)
          }
        }

        history.entries.push(entry)
      }

      return history
    }

    return null
  },

  getNextActiveTab: (state, closeTabId) => {
    if (!tabState.getByTabId(state, closeTabId)) {
      return
    }

    const index = tabState.getIndex(state, closeTabId)
    if (index === -1) {
      return
    }

    const windowId = tabState.getWindowId(state, closeTabId)
    if (windowId === windowState.WINDOW_ID_NONE) {
      return
    }

    const lastActiveTabId = tabState.getTabsByLastActivated(state, windowId).last()
    if (lastActiveTabId !== closeTabId && !tabState.isActive(state, closeTabId)) {
      return
    }

    let nextTabId = tabState.TAB_ID_NONE
    switch (getSetting(settings.TAB_CLOSE_ACTION)) {
      case tabCloseAction.LAST_ACTIVE:
        nextTabId = tabState.getLastActiveTabId(state, windowId)
        break
      case tabCloseAction.PARENT:
        {
          const openerTabId = tabState.getOpenerTabId(state, closeTabId)
          if (openerTabId !== tabState.TAB_ID_NONE) {
            nextTabId = openerTabId
          }
          break
        }
    }

    // DEFAULT: always fall back to NEXT
    if (nextTabId === tabState.TAB_ID_NONE) {
      nextTabId = tabState.getNextTabIdByIndex(state, windowId, index)
      if (nextTabId === tabState.TAB_ID_NONE) {
        // no unpinned tabs so find the next pinned tab
        nextTabId = tabState.getNextTabIdByIndex(state, windowId, index, true)
      }
    }

    return nextTabId
  },
  debugTabs: (state) => {
    console.log(tabState.getTabs(state)
      .toJS()
      .map((tab) => {
        return {
          tabId: tab.tabId,
          index: tab.index,
          windowId: tab.windowId,
          active: tab.active,
          pinned: tab.pinned
        }
      })
      .sort((tab1, tab2) => {
        if (tab1.windowId !== tab2.windowId) {
          return tab1.windowId - tab2.windowId
        }
        if (tab1.index !== tab2.index) {
          return tab1.index - tab2.index
        }
        return 0
      }))
  },
  updateTabsStateForAttachedTab: (state, tabId) => {
    const tabValue = getTabValue(tabId)
    if (!tabValue) {
      return state
    }
    return api.updateTabsStateForWindow(state, tabValue.get('windowId'))
  },
  updateTabsStateForWindow: (state, windowId) => {
    tabState.getTabsByWindowId(state, windowId).forEach((tabValue) => {
      const tabId = tabValue.get('tabId')

      const oldTabValue = tabState.getByTabId(state, tabId)
      const newTabValue = getTabValue(tabId)

      // For now the renderer needs to know about index and pinned changes
      // communicate those out here.
      if (newTabValue && oldTabValue) {
        const changeInfo = {}
        const rendererAwareProps = ['index', 'pinned', 'url', 'active']
        rendererAwareProps.forEach((prop) => {
          const newPropVal = newTabValue.get(prop)
          if (oldTabValue.get(prop) !== newPropVal) {
            changeInfo[prop] = newPropVal
          }
        })
        if (Object.keys(changeInfo).length > 0) {
          updateTab(tabId, changeInfo)
        }
      }

      if (newTabValue) {
        state = tabState.updateTabValue(state, newTabValue, false)
      }
    })
    return state
  }
}

module.exports = api
