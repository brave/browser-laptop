/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appActions = require('../../js/actions/appActions')
const config = require('../../js/constants/config')
const Immutable = require('immutable')
const tabState = require('../common/state/tabState')
const {app, BrowserWindow, extensions, session, ipcMain} = require('electron')
const {makeImmutable} = require('../common/state/immutableUtil')
const {getTargetAboutUrl, getSourceAboutUrl, isSourceAboutUrl, newFrameUrl, isTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const {isURL, getUrlFromInput, toPDFJSLocation, getDefaultFaviconUrl} = require('../../js/lib/urlutil')
const {isSessionPartition} = require('../../js/state/frameStateUtil')
const {getOrigin} = require('../../js/state/siteUtil')
const {getSetting} = require('../../js/settings')
const settings = require('../../js/constants/settings')
const {getBaseUrl, aboutUrls} = require('../../js/lib/appUrlUtil')
const siteSettings = require('../../js/state/siteSettings')
const messages = require('../../js/constants/messages')
const siteUtil = require('../../js/state/siteUtil')
const aboutHistoryState = require('../common/state/aboutHistoryState')
const appStore = require('../../js/stores/appStore')
const appConfig = require('../../js/constants/appConfig')
const siteTags = require('../../js/constants/siteTags')
const {newTabMode} = require('../common/constants/settingsEnums')
const {cleanupWebContents, currentWebContents, getWebContents, updateWebContents} = require('./webContentsCache')

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

// TODO(bridiver) - refactor this into an action
ipcMain.on(messages.ABOUT_COMPONENT_INITIALIZED, (e) => {
  const tab = e.sender
  const listener = () => {
    if (!tab.isDestroyed()) {
      const tabValue = tabState.getByTabId(appStore.getState(), tab.getId())
      if (tabValue.get('active') === true) {
        updateAboutDetails(tab, tabValue)
      }
    } else {
      appStore.removeChangeListener(listener)
    }
  }
  listener()

  appStore.addChangeListener(listener)
  tab.on('set-active', () => {
    listener()
  })
  tab.on('did-navigate', () => {
    appStore.removeChangeListener(listener)
  })
})

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
  const bookmarks = appState.get('sites').filter((site) => site.get('tags').includes(siteTags.BOOKMARK)).toList().sort(siteUtil.siteSort)
  const bookmarkFolders = appState.get('sites').filter((site) => site.get('tags').includes(siteTags.BOOKMARK_FOLDER)).toList().sort(siteUtil.siteSort)
  const sync = appState.get('sync')
  const braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)
  const history = aboutHistoryState.getHistory(appState)
  const adblock = appState.get('adblock')
  const downloads = appState.get('downloads')
  const passwords = appState.get('passwords')
  const trackedBlockersCount = appState.getIn(['trackingProtection', 'count'])
  const adblockCount = appState.getIn(['adblock', 'count'])
  const httpsUpgradedCount = appState.getIn(['httpsEverywhere', 'count'])
  const newTabDetail = appState.getIn(['about', 'newtab'])
  const autofillCreditCards = appState.getIn(['autofill', 'creditCards'])
  const autofillAddresses = appState.getIn(['autofill', 'addresses'])
  const versionInformation = appState.getIn(['about', 'brave', 'versionInformation'])
  const aboutDetails = tabValue.get('aboutDetails')
  if (location === 'about:preferences' || location === 'about:contributions' || location === aboutUrls.get('about:contributions')) {
    const ledgerData = ledgerInfo.merge(publisherInfo).merge(preferencesData)
    tab.send(messages.LEDGER_UPDATED, ledgerData.toJS())
    tab.send(messages.SETTINGS_UPDATED, appSettings.toJS())
    tab.send(messages.SITE_SETTINGS_UPDATED, allSiteSettings.toJS())
    tab.send(messages.SYNC_UPDATED, sync.toJS())
    tab.send(messages.BRAVERY_DEFAULTS_UPDATED, braveryDefaults)
    tab.send(messages.EXTENSIONS_UPDATED, extensionsValue.toJS())
  } else if (location === 'about:bookmarks' && bookmarks) {
    tab.send(messages.BOOKMARKS_UPDATED, {
      bookmarks: bookmarks.toJS(),
      bookmarkFolders: bookmarkFolders.toJS()
    })
  } else if (location === 'about:history' && history) {
    appActions.populateHistory()
    tab.send(messages.HISTORY_UPDATED, history.toJS())
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
  } else if (location === 'about:passwords' && passwords) {
    tab.send(messages.PASSWORD_DETAILS_UPDATED, passwords.toJS())
    tab.send(messages.PASSWORD_SITE_DETAILS_UPDATED,
        allSiteSettings.filter((setting) => setting.get('savePasswords') === false).toJS())
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
      newTabDetail: newTabDetail.toJS()
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

      updateWebContents(tabId, tab)
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

  toggleDevTools: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const tab = getWebContents(tabId)
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
    let tab = getWebContents(tabId)
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
        return state
      }

      tab.loadURL(url)
    }
    return state
  },

  loadURLInActiveTab: (state, windowId, url) => {
    const tabValue = tabState.getActiveTabValue(state, windowId)
    if (tabValue) {
      api.loadURLInTab(state, tabValue.get('tabId'), url)
    }
    return state
  },

  loadURLInTab: (state, tabId, url) => {
    const tab = getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      url = normalizeUrl(url)
      tab.loadURL(url)
    }
    return state
  },

  setAudioMuted: (state, action) => {
    action = makeImmutable(action)
    const muted = action.get('muted')
    const tabId = action.get('tabId')
    const tab = getWebContents(tabId)
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
    const tab = getWebContents(tabId)
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
    const tab = getWebContents(tabId)
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
    const tab = getWebContents(tabId)
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
    if (needsPartitionAssigned(createProperties)) {
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

  moveTo: (state, tabId, frameOpts, browserOpts, windowId) => {
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
      if (windowId != null && currentWindowId === windowId) {
        return state
      }

      if (windowId == null || windowId === -1) {
        // If there's only one tab and we're dragging outside the window, then disallow
        // a new window to be created.
        const windowTabCount = tabState.getTabsByWindowId(state, currentWindowId).size
        if (windowTabCount === 1) {
          return state
        }
      }

      if (tabValue.get('pinned')) {
        // If the current tab is pinned, then don't allow to drag out
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
      const tab = getWebContents(tabData.get('id'))
      if (tab && !tab.isDestroyed()) {
        tab.setActive(true)
      }
    } else {
      api.createTab(state, action)
    }
    return state
  },

  goBack: (state, action) => {
    action = makeImmutable(action)
    const tab = getWebContents(action.get('tabId'))
    if (tab && !tab.isDestroyed()) {
      tab.goBack()
    }
    return state
  },

  goForward: (state, action) => {
    action = makeImmutable(action)
    const tab = getWebContents(action.get('tabId'))
    if (tab && !tab.isDestroyed()) {
      tab.goForward()
    }
    return state
  },

  goToIndex: (state, action) => {
    action = makeImmutable(action)
    const tab = getWebContents(action.get('tabId'))
    if (tab && !tab.isDestroyed()) {
      tab.goToIndex(action.get('index'))
    }
    return state
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
  }
}

module.exports = api
