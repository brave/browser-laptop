/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appActions = require('../../js/actions/appActions')
const windowActions = require('../../js/actions/windowActions')
const tabActions = require('../common/actions/tabActions')
const config = require('../../js/constants/config')
const Immutable = require('immutable')
const tabState = require('../common/state/tabState')
const {app, BrowserWindow, extensions, session, ipcMain} = require('electron')
const {makeImmutable, makeJS} = require('../common/state/immutableUtil')
const {getTargetAboutUrl, getSourceAboutUrl, isSourceAboutUrl, newFrameUrl, isTargetAboutUrl, isIntermediateAboutPage, isTargetMagnetUrl, getSourceMagnetUrl} = require('../../js/lib/appUrlUtil')
const {isURL, getUrlFromInput, toPDFJSLocation, getDefaultFaviconUrl, isHttpOrHttps, getLocationIfPDF} = require('../../js/lib/urlutil')
const {isSessionPartition} = require('../../js/state/frameStateUtil')
const {getOrigin} = require('../../js/lib/urlutil')
const settingsStore = require('../../js/settings')
const settings = require('../../js/constants/settings')
const {getBaseUrl} = require('../../js/lib/appUrlUtil')
const siteSettings = require('../../js/state/siteSettings')
const messages = require('../../js/constants/messages')
const debounce = require('../../js/lib/debounce')
const aboutHistoryState = require('../common/state/aboutHistoryState')
const aboutNewTabState = require('../common/state/aboutNewTabState')
const appStore = require('../../js/stores/appStore')
const appConfig = require('../../js/constants/appConfig')
const {newTabMode} = require('../common/constants/settingsEnums')
const {tabCloseAction} = require('../common/constants/settingsEnums')
const webContentsCache = require('./webContentsCache')
const {FilterOptions} = require('ad-block')
const {isResourceEnabled} = require('../filtering')
const autofill = require('../autofill')
const bookmarksState = require('../common/state/bookmarksState')
const bookmarkFoldersState = require('../common/state/bookmarkFoldersState')
const historyState = require('../common/state/historyState')
const siteSettingsState = require('../common/state/siteSettingsState')
const bookmarkOrderCache = require('../common/cache/bookmarkOrderCache')
const ledgerState = require('../common/state/ledgerState')
const {getWindow} = require('./windows')
const activeTabHistory = require('./activeTabHistory')

let adBlockRegions
let currentPartitionNumber = 0
const incrementPartitionNumber = () => ++currentPartitionNumber

const normalizeUrl = function (url) {
  if (isSourceAboutUrl(url)) {
    url = getTargetAboutUrl(url)
  }
  if (isURL(url)) {
    url = getUrlFromInput(url)
  }
  if (settingsStore.getSetting(settings.PDFJS_ENABLED)) {
    url = toPDFJSLocation(url)
  }
  return url
}

const getTabValue = function (tabId) {
  let tab = webContentsCache.getWebContents(tabId)
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

const aboutTabs = {}
const aboutTabUpdateListener = (tabId) => {
  if (parseInt(tabId)) {
    updateAboutDetails(tabId)
    return
  }

  for (let tabId in aboutTabs) {
    let tab = webContentsCache.getWebContents(tabId)
    if (!tab || tab.isDestroyed()) {
      delete aboutTabs[tabId]
    } else {
      const tabValue = getTabValue(tabId)
      if (tabValue && tabValue.get('active') === true) {
        updateAboutDetails(tabId)
      }
    }
  }
}

const isOnAboutLocation = (url, search) => {
  if (url == null) {
    return false
  }

  const path = url.split('?')
  return Array.isArray(path) && path[0] === search
}

appStore.addChangeListener(debounce(aboutTabUpdateListener, 100))

ipcMain.on(messages.ABOUT_COMPONENT_INITIALIZED, (e) => {
  const tab = e.sender
  const tabId = tab.getId()
  aboutTabs[tabId] = {}

  const url = getSourceAboutUrl(tab.getURL())
  const location = getBaseUrl(url)
  if (location === 'about:preferences') {
    if (isOnAboutLocation(url, 'about:preferences#payments')) {
      appActions.ledgerPaymentsPresent(tabId, true)
    } else {
      appActions.ledgerPaymentsPresent(tabId, false)
    }

    tab.on('will-destroy', () => {
      appActions.ledgerPaymentsPresent(tabId, false)
    })
    tab.once('did-navigate', () => {
      appActions.ledgerPaymentsPresent(tabId, false)
    })
    tab.on('did-navigate-in-page', (e, newUrl) => {
      updateAboutDetails(tabId)
      const url = getSourceAboutUrl(newUrl)
      if (isOnAboutLocation(url, 'about:preferences#payments')) {
        appActions.ledgerPaymentsPresent(tabId, true)
      } else {
        appActions.ledgerPaymentsPresent(tabId, false)
      }
    })
  }
})

const getBookmarksData = (state) => {
  return Immutable.Map()
    .set('bookmarks', bookmarksState.getBookmarks(state))
    .set('bookmarkFolders', bookmarkFoldersState.getFolders(state))
    .set('bookmarkOrder', bookmarkOrderCache.getOrderCache(state))
}

const sendAboutDetails = (tabId, type, value, shared = false) => {
  // use a weak map to avoid holding references to large objects that will never be equal to anything
  aboutTabs[tabId][type] = aboutTabs[tabId][type] || new WeakMap()
  if (aboutTabs[tabId] && !aboutTabs[tabId][type].get(value)) {
    const tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      if (shared) {
        const handle = muon.shared_memory.create(makeJS(value))
        tab.sendShared(type, handle)
      } else {
        tab.send(type, makeJS(value))
      }
      aboutTabs[tabId][type] = new WeakMap()
      aboutTabs[tabId][type].set(value, true)
    }
  }
}

const updateAboutDetails = (tabId) => {
  const appState = appStore.getState()
  const tabValue = tabState.getByTabId(appState, tabId)
  if (!tabValue) {
    return
  }

  let url = tabValue.get('url')
  if (isTargetAboutUrl(url)) {
    url = getSourceAboutUrl(url)
  } else if (!isSourceAboutUrl(url)) {
    return
  }

  const location = getBaseUrl(url)
  const onPaymentsPage = isOnAboutLocation(url, 'about:preferences#payments')

  const appSettings = appState.get('settings')
  const braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)

  // DO NOT ADD TO THIS LIST - use aboutDetails and send only the data necessary to render the page
  if (location === 'about:preferences') {
    const allSiteSettings = siteSettingsState.getAllSiteSettings(appState, tabValue.get('incognito') === true)
    sendAboutDetails(tabId, messages.SITE_SETTINGS_UPDATED, allSiteSettings)
    sendAboutDetails(tabId, messages.BRAVERY_DEFAULTS_UPDATED, braveryDefaults)
    sendAboutDetails(tabId, messages.SETTINGS_UPDATED, appSettings)
  }
  if (location === 'about:contributions' || onPaymentsPage) {
    const ledgerInfo = ledgerState.getInfoProps(appState)
    const preferencesData = appState.getIn(['about', 'preferences'], Immutable.Map())
    const synopsis = appState.getIn(['ledger', 'about'])
    const migration = appState.get('migrations')
    const wizardData = ledgerState.geWizardData(appState)
    const ledgerData = ledgerInfo
      .merge(synopsis)
      .merge(preferencesData)
      .set('wizardData', wizardData)
      .set('migration', migration)
      .set('promotion', ledgerState.getAboutPromotion(appState))
    sendAboutDetails(tabId, messages.LEDGER_UPDATED, ledgerData)
  } else if (url === 'about:preferences#sync' || location === 'about:contributions' || onPaymentsPage) {
    const sync = appState.get('sync', Immutable.Map())
    sendAboutDetails(tabId, messages.SYNC_UPDATED, sync)
  } else if (location === 'about:extensions' || url === 'about:preferences#extensions') {
    const extensionsValue = appState.get('extensions', Immutable.Map())
    sendAboutDetails(tabId, messages.EXTENSIONS_UPDATED, extensionsValue)
  } else if (location === 'about:bookmarks') {
    const bookmarksData = getBookmarksData(appState)
    if (bookmarksData.get('bookmarks')) {
      sendAboutDetails(tabId, messages.BOOKMARKS_UPDATED, bookmarksData, true)
    }
  } else if (location === 'about:history') {
    const history = aboutHistoryState.getHistory(appState)
    if (!history) {
      appActions.populateHistory()
    } else {
      sendAboutDetails(tabId, messages.HISTORY_UPDATED, history, true)
    }
    sendAboutDetails(tabId, messages.SETTINGS_UPDATED, appSettings)
  } else if (location === 'about:adblock') {
    if (!adBlockRegions) {
      adBlockRegions = require('ad-block').adBlockLists.regions
    }
    const adblock = appState.get('adblock', Immutable.Map())
    sendAboutDetails(tabId, messages.ADBLOCK_UPDATED, {
      adblock: adblock.toJS(),
      settings: appSettings.toJS(),
      resources: adBlockRegions
    })
  } else if (location === 'about:downloads') {
    const downloads = appState.get('downloads', Immutable.Map())
    sendAboutDetails(tabId, messages.DOWNLOADS_UPDATED, {
      downloads: downloads.toJS()
    })
  } else if (location === 'about:passwords') {
    autofill.getAutofillableLogins((result) => {
      sendAboutDetails(tabId, messages.PASSWORD_DETAILS_UPDATED, result)
    })
    autofill.getBlackedlistLogins((result) => {
      sendAboutDetails(tabId, messages.PASSWORD_SITE_DETAILS_UPDATED, result)
    })
  } else if (location === 'about:flash') {
    sendAboutDetails(tabId, messages.BRAVERY_DEFAULTS_UPDATED, braveryDefaults.toJS())
  } else if (location === 'about:newtab') {
    const newTabDetail = aboutNewTabState.getData(appState)
    const showEmptyPage = settingsStore.getSetting(settings.NEWTAB_MODE) === newTabMode.EMPTY_NEW_TAB
    const showImages = settingsStore.getSetting(settings.SHOW_DASHBOARD_IMAGES) && !showEmptyPage
    const trackedBlockersCount = appState.getIn(['trackingProtection', 'count'], 0)
    const httpsUpgradedCount = appState.getIn(['httpsEverywhere', 'count'], 0)
    const adblockCount = appState.getIn(['adblock', 'count'], 0)
    sendAboutDetails(tabId, messages.NEWTAB_DATA_UPDATED, {
      showEmptyPage,
      showImages,
      trackedBlockersCount,
      adblockCount,
      httpsUpgradedCount,
      newTabDetail: newTabDetail.toJS()
    })
  } else if (location === 'about:autofill') {
    const autofillCreditCards = appState.getIn(['autofill', 'creditCards'], Immutable.Map())
    const autofillAddresses = appState.getIn(['autofill', 'addresses'], Immutable.Map())
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
      sendAboutDetails(tabId, messages.AUTOFILL_ADDRESSES_UPDATED, list)
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
      sendAboutDetails(tabId, messages.AUTOFILL_CREDIT_CARDS_UPDATED, list)
    }
  } else if (location === 'about:brave') {
    const versionInformation = appState.getIn(['about', 'brave', 'versionInformation'], Immutable.Map())
    sendAboutDetails(tabId, messages.VERSION_INFORMATION_UPDATED, versionInformation)
  }

  const aboutDetails = tabValue.get('aboutDetails', Immutable.Map())
  sendAboutDetails(tabId, messages.STATE_UPDATED, aboutDetails)
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

let backgroundProcess = null
let backgroundProcessTimer = null
/**
 * Execute script in the browser tab
 * @param win{object} - window in which we want to execute script
 * @param debug{boolean} - would you like to close window or not
 * @param script{string} - script that you want to execute
 * @param cb{function} - function that we call after script is completed
 */
const runScript = (win, debug, script, cb) => {
  win.webContents.executeScriptInTab(config.braveExtensionId, script, {}, (err, url, result) => {
    cb(err, url, result)
    if (!debug) {
      backgroundProcessTimer = setTimeout(() => {
        if (backgroundProcess) {
          win.close()
          backgroundProcess = null
        }
      }, 2 * 60 * 1000) // 2 min
    }
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
      webContentsCache.updateWebContents(tabId, newTab, openerTabId)
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

      tab.on('enable-pepper-menu', (e, params) => {
        appActions.enablePepperMenu(params, tabId)
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

      tab.on('will-attach', (e, windowWebContents) => {
        appActions.tabWillAttach(tab.getId())
      })

      tab.on('set-active', (sender, isActive) => {
        if (isActive) {
          const tabValue = getTabValue(tabId)
          if (tabValue) {
            const windowId = tabValue.get('windowId')
            // set-active could be called multiple times even when the index does not change
            // so make sure we only add this to the active-tab trail for the window
            // once
            if (activeTabHistory.getActiveTabForWindow(windowId, 0) !== tabId) {
              activeTabHistory.setActiveTabForWindow(windowId, tabId)
            }
          }
        }
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

      tab.on('did-detach', (e, oldTabId) => {
        // forget last active trail in window tab
        // is detaching from
        const oldTab = getTabValue(oldTabId)
        const detachedFromWindowId = oldTab.get('windowId')
        if (detachedFromWindowId != null) {
          activeTabHistory.clearTabFromWindow(detachedFromWindowId, oldTabId)
        }
      })

      tab.on('did-attach', (e, tabId) => {
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
          windowActions.gotResponseDetails(tabId, {status, newURL, originalURL, httpResponseCode, requestMethod, referrer, resourceType})
        }
      })

      tab.once('will-destroy', (e) => {
        const tabValue = getTabValue(tabId)
        if (tabValue) {
          const windowId = tabValue.get('windowId')
          // forget about this tab in the history of active tabs
          activeTabHistory.clearTabFromWindow(windowId, tabId)
          // handle closed tab being the current active tab for window
          if (tabValue.get('active')) {
            // set the next active tab, if different from what muon will have set to
            // Muon sets it to the next index (immediately above or below)
            // But this app can be configured to select the parent tab,
            // or the last active tab
            let nextTabId = api.getNextActiveTabId(windowId, tabId)
            if (nextTabId != null) {
              api.setActive(nextTabId)
            }
          }
          // let the state know
          appActions.tabClosed(tabId, windowId)
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
    for (let tabId in webContentsCache.currentWebContents) {
      const tabData = webContentsCache.currentWebContents[tabId]
      try {
        if (tabData && tabData.tab && !tabData.tab.isDestroyed()) {
          tabData.tab.send(...args)
        }
      } catch (e) {
        // ignore exceptions
      }
    }
  },

  toggleDevTools: (tabId) => {
    const tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      if (tab.isDevToolsOpened()) {
        tab.closeDevTools()
      } else {
        tab.openDevTools()
      }
    }
  },

  inspectElement: (tabId, x, y) => {
    const tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.inspectElement(x, y)
    }
  },

  setActive: (tabId) => {
    let tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setActive(true)
    }
  },

  setTabIndex: (tabId, index) => {
    let tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setTabIndex(index)
    }
  },

  reload: (tabId, ignoreCache = false) => {
    const tab = webContentsCache.getWebContents(tabId)
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
    const tab = webContentsCache.getWebContents(tabId)
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
    const tab = webContentsCache.getWebContents(tabId)
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
    const tab = webContentsCache.getWebContents(tabId)
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
    const tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.clone(options.toJS(), (newTab) => {
      })
    }
  },

  pin: (state, tabId, pinned) => {
    const tab = webContentsCache.getWebContents(tabId)
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
    const tab = webContentsCache.getWebContents(tabId)
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
    const tab = webContentsCache.getWebContents(tabId)
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
      const switchToNewTabsImmediately = settingsStore.getSetting(settings.SWITCH_TO_NEW_TABS) === true
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

      const doCreate = () => {
        extensions.createTab(createProperties, (tab) => {
          cb && cb(tab)
        })
      }

      if (createProperties.windowId) {
        const win = getWindow(createProperties.windowId)
        if (!win || win.isDestroyed()) {
          console.error('Cannot create a tab for a window which does not exist or is destroyed')
          return
        }
        if (!win.__ready) {
          win.once(messages.WINDOW_RENDERER_READY, () => {
            doCreate()
          })
          return
        }
      }
      doCreate()
    })
  },

  /**
   * Execute script in the background browser window
   * @param script{string} - script that we want to run
   * @param cb{function} - function that we want to call when script is done
   * @param debug{boolean} - would you like to keep browser window when script is done
   */
  executeScriptInBackground: (script, cb, debug = false) => {
    if (backgroundProcessTimer) {
      clearTimeout(backgroundProcessTimer)
    }

    if (backgroundProcess === null) {
      backgroundProcess = new BrowserWindow({
        show: debug,
        webPreferences: {
          partition: 'default'
        }
      })

      backgroundProcess.webContents.on('did-finish-load', () => {
        runScript(backgroundProcess, debug, script, cb)
      })
      backgroundProcess.loadURL('about:blank')
    } else {
      runScript(backgroundProcess, debug, script, cb)
    }
  },

  moveTo: (state, tabId, frameOpts, browserOpts, toWindowId) => {
    frameOpts = makeImmutable(frameOpts)
    browserOpts = makeImmutable(browserOpts)
    const tab = webContentsCache.getWebContents(tabId)
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

      // detach from current window
      tab.detach(() => {
        // handle tab has detached from window
        // handle tab was the active tab of the window
        if (tabValue.get('active')) {
          // decide and set next-active-tab muon override
          const nextActiveTabIdForOldWindow = api.getNextActiveTabId(currentWindowId, tabId)
          if (nextActiveTabIdForOldWindow !== null) {
            api.setActive(nextActiveTabIdForOldWindow)
          }
        }
        if (toWindowId == null || toWindowId === -1) {
          // move tab to a new window
          frameOpts = frameOpts.set('index', 0)
          appActions.newWindow(frameOpts, browserOpts)
        } else {
          // ask for tab to be attached (via frame state and webview) to
          // specified window
          appActions.newWebContentsAdded(toWindowId, frameOpts, tabValue)
        }
        // handle tab has made it to the new window
        tab.once('did-attach', () => {
          // put the tab in the desired index position
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
    const tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.setWebRTCIPHandlingPolicy(policy)
    }
  },

  goBack: (tabId) => {
    const tab = webContentsCache.getWebContents(tabId)
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
    const tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed() && tab.canGoForward()) {
      tab.goForward()
    }
  },

  goToIndex: (tabId, index) => {
    const tab = webContentsCache.getWebContents(tabId)
    const validIndex = index >= 0 && index < tab.getEntryCount()
    if (tab && !tab.isDestroyed() && validIndex) {
      tab.goToIndex(index)
    }
  },

  getHistoryEntries: (state, action) => {
    const tab = webContentsCache.getWebContents(action.get('tabId'))
    const sites = state ? historyState.getSites(state) : null

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
            const site = sites.find((element) => element.get('location') === url)
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

  getNextActiveTabId: (windowId, closedTabId) => {
    const nextTabActionType = settingsStore.getSetting(settings.TAB_CLOSE_ACTION)

    if (nextTabActionType === tabCloseAction.LAST_ACTIVE) {
      return activeTabHistory.getActiveTabForWindow(windowId)
    }

    if (nextTabActionType === tabCloseAction.PARENT) {
      const parentTabId = webContentsCache.getOpenerTabId(closedTabId)
      if (parentTabId != null) {
        const parentTab = getTabValue(parentTabId)
        // make sure parent tab still exists
        if (parentTab) {
          // make sure parent tab is same window (it may have been detached)
          // otherwise we'll make it active in the wrong window
          if (parentTab.get('windowId') === windowId) {
            return parentTabId
          }
        }
      }
    }

    return null
  },

  closeTabPage: (state, windowId, tabPageIndex) => {
    const tabsPerPage = Number(settingsStore.getSetting(settings.TABS_PER_PAGE))
    const startTabIndex = tabPageIndex * tabsPerPage
    const pinnedTabsCount = tabState.getPinnedTabsByWindowId(state, windowId).size
    tabState.getTabsByWindowId(state, windowId)
      .sort((tab1, tab2) => tab1.get('index') - tab2.get('index'))
      .filter((tabValue) => !tabValue.get('pinned'))
      .slice(startTabIndex + pinnedTabsCount, startTabIndex + tabsPerPage + pinnedTabsCount)
      .forEach((tabValue) => {
        const tab = webContentsCache.getWebContents(tabValue.get('tabId'))
        if (tab && !tab.isDestroyed()) {
          tab.forceClose()
        }
      })
    state = api.updateTabsStateForWindow(state, windowId)
    return state
  },

  closeTabsToLeft: (state, tabId) => {
    const tabValue = tabState.getByTabId(state, tabId)
    if (!tabValue) {
      return state
    }
    const index = tabValue.get('index')
    const windowId = tabValue.get('windowId')
    const pinnedTabsCount = tabState.getPinnedTabsByWindowId(state, windowId).size
    tabState.getTabsByWindowId(state, windowId)
      .sort((tab1, tab2) => tab1.get('index') - tab2.get('index'))
      .filter((tabValue) => !tabValue.get('pinned'))
      .slice(0, index - pinnedTabsCount)
      .forEach((tabValue) => {
        const tab = webContentsCache.getWebContents(tabValue.get('tabId'))
        if (tab && !tab.isDestroyed()) {
          tab.forceClose()
        }
      })
    state = api.updateTabsStateForWindow(state, windowId)
    return state
  },

  closeTabsToRight: (state, tabId) => {
    const tabValue = tabState.getByTabId(state, tabId)
    if (!tabValue) {
      return state
    }
    const index = tabValue.get('index')
    const windowId = tabValue.get('windowId')
    const pinnedTabsCount = tabState.getPinnedTabsByWindowId(state, windowId).size
    tabState.getTabsByWindowId(state, windowId)
      .sort((tab1, tab2) => tab1.get('index') - tab2.get('index'))
      .filter((tabValue) => !tabValue.get('pinned'))
      .slice(index + 1 - pinnedTabsCount)
      .forEach((tabValue) => {
        const tab = webContentsCache.getWebContents(tabValue.get('tabId'))
        if (tab && !tab.isDestroyed()) {
          tab.forceClose()
        }
      })
    state = api.updateTabsStateForWindow(state, windowId)
    return state
  },

  closeOtherTabs: (state, tabId) => {
    const tabValue = tabState.getByTabId(state, tabId)
    if (!tabValue) {
      return state
    }
    const windowId = tabValue.get('windowId')
    tabState.getTabsByWindowId(state, windowId)
      .forEach((tabValue) => {
        const tab = webContentsCache.getWebContents(tabValue.get('tabId'))
        if (tab && !tab.isDestroyed() && tabValue.get('tabId') !== tabId && !tabValue.get('pinned')) {
          tab.forceClose()
        }
      })
    state = api.updateTabsStateForWindow(state, windowId)
    return state
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
  },
  forgetTab: (tabId) => {
    webContentsCache.cleanupWebContents(tabId)
  }
}

module.exports = api
