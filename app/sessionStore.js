/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// Session store in Brave works as follows:
// - Electron sends a ‘before-quit’ event
// - Brave sends REQUEST_WINDOW_STATE to each renderer process
// - Each renderer responds with its window state with a RESPONSE_WINDOW_STATE IPC message
// - When all state is collected save it to a JSON file and close the app
// - NODE_ENV of ‘test’ bypassing session state or else they all fail.

const Immutable = require('immutable')
const fs = require('fs-extra')
const path = require('path')
const electron = require('electron')
const app = electron.app
const locale = require('./locale')
const UpdateStatus = require('../js/constants/updateStatus')
const settings = require('../js/constants/settings')
const downloadStates = require('../js/constants/downloadStates')
const {tabFromFrame} = require('../js/state/frameStateUtil')
const siteUtil = require('../js/state/siteUtil')
const { topSites, pinnedTopSites } = require('../js/data/newTabData')
const sessionStorageVersion = 1
const filtering = require('./filtering')
const autofill = require('./autofill')
const {navigatableTypes} = require('../js/lib/appUrlUtil')
const Channel = require('./channel')
const { makeImmutable } = require('./common/state/immutableUtil')
const tabState = require('./common/state/tabState')
const windowState = require('./common/state/windowState')

const getSetting = require('../js/settings').getSetting
const promisify = require('../js/lib/promisify')
const sessionStorageName = `session-store-${sessionStorageVersion}`

const getTopSiteMap = () => {
  if (Array.isArray(topSites) && topSites.length) {
    let siteMap = {}
    let order = 0
    topSites.forEach((site) => {
      let key = siteUtil.getSiteKey(Immutable.fromJS(site))
      site.order = order++
      siteMap[key] = site
    })
    return siteMap
  }
  return {}
}

const getTempStoragePath = (filename) => {
  const epochTimestamp = (new Date()).getTime().toString()
  filename = filename || 'tmp'
  return process.env.NODE_ENV !== 'test'
    ? path.join(app.getPath('userData'), 'session-store-' + filename + '-' + epochTimestamp)
    : path.join(process.env.HOME, '.brave-test-session-store-' + filename + '-' + epochTimestamp)
}

const getStoragePath = () => {
  return path.join(app.getPath('userData'), sessionStorageName)
}
/**
 * Saves the specified immutable browser state to storage.
 *
 * @param {object} payload - Application state as per
 *   https://github.com/brave/browser/wiki/Application-State
 *   (not immutable data)
 * @return a promise which resolves when the state is saved
 */
module.exports.saveAppState = (payload, isShutdown) => {
  return new Promise((resolve, reject) => {
    // Don't persist private frames
    let startupModeSettingValue
    if (require('../js/stores/appStore').getState()) {
      startupModeSettingValue = getSetting(settings.STARTUP_MODE)
    }
    const savePerWindowState = startupModeSettingValue === undefined ||
      startupModeSettingValue === 'lastTime'
    if (payload.perWindowState && savePerWindowState) {
      payload.perWindowState.forEach((wndPayload) => {
        wndPayload.frames = wndPayload.frames.filter((frame) => !frame.isPrivate)
      })
      // tabs will be auto-reset to what the frame is in cleanAppData but just in
      // case clean fails we don't want to save private tabs.
      payload.perWindowState.forEach((wndPayload) => {
        wndPayload.tabs = wndPayload.tabs.filter((tab) => !tab.isPrivate)
      })
    } else {
      delete payload.perWindowState
    }

    try {
      payload = module.exports.cleanAppData(payload, isShutdown)
      payload.cleanedOnShutdown = isShutdown
    } catch (e) {
      payload.cleanedOnShutdown = false
    }
    payload.lastAppVersion = app.getVersion()

    const tmpStoragePath = getTempStoragePath()

    let p = promisify(fs.writeFile, tmpStoragePath, JSON.stringify(payload))
      .then(() => promisify(fs.rename, tmpStoragePath, getStoragePath()))
    if (isShutdown) {
      p = p.then(module.exports.cleanSessionDataOnShutdown())
    }
    p.then(resolve)
      .catch(reject)
  })
}

/**
 * Cleans session data from unwanted values.
 */
module.exports.cleanPerWindowData = (perWindowData, isShutdown) => {
  if (!perWindowData) {
    perWindowData = {}
  }
  // Hide the context menu when we restore.
  delete perWindowData.contextMenuDetail
  // Don't save preview frame since they are only related to hovering on a tab
  delete perWindowData.previewFrameKey
  // Don't save widevine panel detail
  delete perWindowData.widevinePanelDetail
  // Don't save preview tab pages
  if (perWindowData.ui && perWindowData.ui.tabs) {
    delete perWindowData.ui.tabs.previewTabPageIndex
  }
  // Don't restore add/edit dialog
  delete perWindowData.bookmarkDetail
  // Don't restore bravery panel
  delete perWindowData.braveryPanelDetail
  // Don't restore drag data and clearBrowsingDataPanel's visibility
  if (perWindowData.ui) {
    delete perWindowData.ui.dragging
    delete perWindowData.ui.isClearBrowsingDataPanelVisible
  }
  perWindowData.frames = perWindowData.frames || []
  let newKey = 0
  const cleanFrame = (frame) => {
    newKey++
    // Reset the ids back to sequential numbers
    if (frame.key === perWindowData.activeFrameKey) {
      perWindowData.activeFrameKey = newKey
    } else {
      // For now just set everything to unloaded unless it's the active frame
      frame.unloaded = true
    }
    frame.key = newKey

    // Set the frame src to the last visited location
    // or else users will see the first visited URL.
    // Pinned location always get reset to what they are
    frame.src = frame.pinnedLocation || frame.location

    // If a blob is present for the thumbnail, create the object URL
    if (frame.thumbnailBlob) {
      try {
        frame.thumbnailUrl = window.URL.createObjectURL(frame.thumbnailBlob)
      } catch (e) {
        delete frame.thumbnailUrl
      }
    }

    // Delete lists of blocked sites
    delete frame.trackingProtection
    delete frame.httpsEverywhere
    delete frame.adblock
    delete frame.noScript
    delete frame.trackingProtection

    // Guest instance ID's are not valid after restarting.
    // Electron won't know about them.
    delete frame.guestInstanceId

    // Tab ids are per-session and should not be persisted
    delete frame.tabId

    // Do not show the audio indicator until audio starts playing
    delete frame.audioMuted
    delete frame.audioPlaybackActive
    // Let's not assume wknow anything about loading
    delete frame.loading
    // Always re-determine the security data
    delete frame.security
    // Value is only used for local storage
    delete frame.isActive
    // Hide modal prompts.
    delete frame.modalPromptDetail
    // Remove HTTP basic authentication requests.
    delete frame.basicAuthDetail
    // Remove open search details
    delete frame.searchDetail
    // Remove find in page details
    if (frame.findDetail) {
      delete frame.findDetail.numberOfMatches
      delete frame.findDetail.activeMatchOrdinal
      delete frame.findDetail.internalFindStatePresent
    }
    delete frame.findbarShown
    // Don't restore full screen state
    delete frame.isFullScreen
    delete frame.showFullScreenWarning
    // Don't store child tab open ordering since keys
    // currently get re-generated when session store is
    // restored.  We will be able to keep this once we
    // don't regenerate new frame keys when opening storage.
    delete frame.parentFrameKey
    // Delete the active shortcut details
    delete frame.activeShortcutDetails

    if (frame.navbar && frame.navbar.urlbar) {
      if (frame.navbar.urlbar.suggestions) {
        frame.navbar.urlbar.suggestions.selectedIndex = null
        frame.navbar.urlbar.suggestions.suggestionList = null
      }
      delete frame.navbar.urlbar.searchDetail
    }
  }
  const clearHistory = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_HISTORY) === true
  if (clearHistory) {
    perWindowData.closedFrames = []
  }

  // Clean closed frame data before frames because the keys are re-ordered
  // and the new next key is calculated in windowStore.js based on
  // the max frame key ID.
  if (perWindowData.closedFrames) {
    perWindowData.closedFrames.forEach(cleanFrame)
  }
  if (perWindowData.frames) {
    // Don't restore pinned locations because they will be auto created by the app state change event
    perWindowData.frames = perWindowData.frames
      .filter((frame) => !frame.pinnedLocation)
    perWindowData.frames.forEach(cleanFrame)
  }
  // Always recalculate tab data from frame data
  perWindowData.tabs = perWindowData.frames.map((frame) => tabFromFrame(frame))
}

/**
 * Cleans app data before it's written to disk.
 * @param {Object} data - top-level app data
 * @param {Object} isShutdown - true if the data is being cleared for a shutdown
 * WARNING: getPrefs is only available in this function when isShutdown is true
 */
module.exports.cleanAppData = (data, isShutdown) => {
  // make a copy
  // TODO(bridiver) use immutable
  data = makeImmutable(data).toJS()

  // Don't show notifications from the last session
  data.notifications = []
  // Delete temp site settings
  data.temporarySiteSettings = {}

  if (data.settings && data.settings[settings.CHECK_DEFAULT_ON_STARTUP] === true) {
    // Delete defaultBrowserCheckComplete state since this is checked on startup
    delete data.defaultBrowserCheckComplete
  }
  // Delete Recovery status on shut down
  try {
    delete data.ui.about.preferences.recoverySucceeded
  } catch (e) {}

  if (data.perWindowState) {
    data.perWindowState.forEach((perWindowState) =>
      module.exports.cleanPerWindowData(perWindowState, isShutdown))
  }
  const clearAutocompleteData = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA) === true
  if (clearAutocompleteData) {
    try {
      autofill.clearAutocompleteData()
    } catch (e) {
      console.log('cleanAppData: error calling autofill.clearAutocompleteData: ', e)
    }
  }
  const clearAutofillData = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_AUTOFILL_DATA) === true
  if (clearAutofillData) {
    autofill.clearAutofillData()
    const date = new Date().getTime()
    data.autofill = {
      addresses: {
        guid: [],
        timestamp: date
      },
      creditCards: {
        guid: [],
        timestamp: date
      }
    }
  }
  const clearSiteSettings = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_SITE_SETTINGS) === true
  if (clearSiteSettings) {
    data.siteSettings = {}
  }
  // Delete expired Flash and NoScript allow-once approvals
  let now = Date.now()
  for (var host in data.siteSettings) {
    let expireTime = data.siteSettings[host].flash
    if (typeof expireTime === 'number' && expireTime < now) {
      delete data.siteSettings[host].flash
    }
    let noScript = data.siteSettings[host].noScript
    if (typeof noScript === 'number') {
      delete data.siteSettings[host].noScript
    }
    // Don't persist any noScript exceptions
    delete data.siteSettings[host].noScriptExceptions
    // Don't write runInsecureContent to session
    delete data.siteSettings[host].runInsecureContent
    // If the site setting is empty, delete it for privacy
    if (Object.keys(data.siteSettings[host]).length === 0) {
      delete data.siteSettings[host]
    }
  }
  if (data.sites) {
    const clearHistory = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_HISTORY) === true
    if (clearHistory) {
      data.sites = siteUtil.clearHistory(Immutable.fromJS(data.sites)).toJS()
      if (data.about) {
        delete data.about.history
        delete data.about.newtab
      }
    }
  }
  if (data.downloads) {
    const clearDownloads = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_DOWNLOADS) === true
    if (clearDownloads) {
      delete data.downloads
    } else {
      // Always at least delete downloaded items older than a week
      const dateOffset = 7 * 24 * 60 * 60 * 1000
      const lastWeek = new Date().getTime() - dateOffset
      Object.keys(data.downloads).forEach((downloadId) => {
        if (data.downloads[downloadId].startTime < lastWeek) {
          delete data.downloads[downloadId]
        } else {
          const state = data.downloads[downloadId].state
          if (state === downloadStates.IN_PROGRESS || state === downloadStates.PAUSED) {
            data.downloads[downloadId].state = downloadStates.INTERRUPTED
          }
        }
      })
    }
  }

  try {
    data = tabState.getPersistentState(data).toJS()
  } catch (e) {
    delete data.tabs
    console.log('cleanAppData: error calling tabState.getPersistentState: ', e)
  }

  try {
    data = windowState.getPersistentState(data).toJS()
  } catch (e) {
    delete data.windows
    console.log('cleanAppData: error calling windowState.getPersistentState: ', e)
  }

  if (data.extensions) {
    Object.keys(data.extensions).forEach((extensionId) => {
      delete data.extensions[extensionId].tabs
    })
  }
  return data
}

/**
 * Cleans session data on shutdown if the prefs are on.
 * @return a promise which resolve when the work is done.
 */
module.exports.cleanSessionDataOnShutdown = () => {
  let p = Promise.resolve()
  if (getSetting(settings.SHUTDOWN_CLEAR_ALL_SITE_COOKIES) === true) {
    p = p.then(filtering.clearStorageData())
  }
  if (getSetting(settings.SHUTDOWN_CLEAR_CACHE) === true) {
    p = p.then(filtering.clearCache())
  }
  return p
}

const safeGetVersion = (fieldName, getFieldVersion) => {
  const versionField = {
    name: fieldName,
    version: undefined
  }
  try {
    if (typeof getFieldVersion === 'function') {
      versionField.version = getFieldVersion()
      return versionField
    }
    console.log('ERROR getting value for field ' + fieldName + ' in sessionStore::setVersionInformation(): ', getFieldVersion, ' is not a function')
  } catch (e) {
    console.log('ERROR getting value for field ' + fieldName + ' in sessionStore::setVersionInformation(): ', e)
  }
  return versionField
}

/**
 * version information (shown on about:brave)
 */
const setVersionInformation = (data) => {
  const versionFields = [
    ['Brave', app.getVersion],
    ['rev', Channel.browserLaptopRev],
    ['Muon', () => { return process.versions['atom-shell'] }],
    ['libchromiumcontent', () => { return process.versions['chrome'] }],
    ['V8', () => { return process.versions.v8 }],
    ['Node.js', () => { return process.versions.node }],
    ['Update Channel', Channel.channel],
    ['os.platform', require('os').platform],
    ['os.release', require('os').release],
    ['os.arch', require('os').arch]
  ]
  const versionInformation = []

  versionFields.forEach((field) => {
    versionInformation.push(safeGetVersion(field[0], field[1]))
  })

  data.about = data.about || {}
  data.about.brave = {
    versionInformation: versionInformation
  }
  return data
}

module.exports.runPreMigrations = (data) => {
  // autofill data migration
  if (data.autofill) {
    if (Array.isArray(data.autofill.addresses)) {
      let addresses = exports.defaultAppState().autofill.addresses
      data.autofill.addresses.forEach((guid) => {
        addresses.guid.push(guid)
        addresses.timestamp = new Date().getTime()
      })
      data.autofill.addresses = addresses
    }
    if (Array.isArray(data.autofill.creditCards)) {
      let creditCards = exports.defaultAppState().autofill.creditCards
      data.autofill.creditCards.forEach((guid) => {
        creditCards.guid.push(guid)
        creditCards.timestamp = new Date().getTime()
      })
      data.autofill.creditCards = creditCards
    }
    if (data.autofill.addresses.guid) {
      let guids = []
      data.autofill.addresses.guid.forEach((guid) => {
        if (typeof guid === 'object') {
          guids.push(guid['persist:default'])
        } else {
          guids.push(guid)
        }
      })
      data.autofill.addresses.guid = guids
    }
    if (data.autofill.creditCards.guid) {
      let guids = []
      data.autofill.creditCards.guid.forEach((guid) => {
        if (typeof guid === 'object') {
          guids.push(guid['persist:default'])
        } else {
          guids.push(guid)
        }
      })
      data.autofill.creditCards.guid = guids
    }
  }
  // xml migration
  if (data.settings) {
    if (data.settings[settings.DEFAULT_SEARCH_ENGINE] === 'content/search/google.xml') {
      data.settings[settings.DEFAULT_SEARCH_ENGINE] = 'Google'
    }
    if (data.settings[settings.DEFAULT_SEARCH_ENGINE] === 'content/search/duckduckgo.xml') {
      data.settings[settings.DEFAULT_SEARCH_ENGINE] = 'DuckDuckGo'
    }
  }

  return data
}

module.exports.runPostMigrations = (data) => {
  // sites refactoring migration
  if (Array.isArray(data.sites) && data.sites.length) {
    let sites = {}
    let order = 0
    data.sites.forEach((site) => {
      let key = siteUtil.getSiteKey(Immutable.fromJS(site))
      site.order = order++
      sites[key] = site
    })
    data.sites = sites
  }

  return data
}

/**
 * Loads the browser state from storage.
 *
 * @return a promise which resolves with the immutable browser state or
 * rejects if the state cannot be loaded.
 */
module.exports.loadAppState = () => {
  return new Promise((resolve, reject) => {
    let data
    try {
      data = fs.readFileSync(getStoragePath())
    } catch (e) {}

    let loaded = false
    try {
      data = JSON.parse(data)
      loaded = true
    } catch (e) {
      // Session state might be corrupted; let's backup this
      // corrupted value for people to report into support.
      module.exports.backupSession()
      if (data) {
        console.log('could not parse data: ', data, e)
      }
      data = exports.defaultAppState()
    }

    if (loaded) {
      data = module.exports.runPreMigrations(data)

      // Clean app data here if it wasn't cleared on shutdown
      if (data.cleanedOnShutdown !== true || data.lastAppVersion !== app.getVersion()) {
        data = module.exports.cleanAppData(data, false)
      }
      data = Object.assign(module.exports.defaultAppState(), data)
      data.cleanedOnShutdown = false

      // Always recalculate the update status
      if (data.updates) {
        const updateStatus = data.updates.status
        delete data.updates.status
        // The process always restarts after an update so if the state
        // indicates that a restart isn't wanted, close right away.
        if (updateStatus === UpdateStatus.UPDATE_APPLYING_NO_RESTART) {
          module.exports.saveAppState(data, true).then(() => {
            // Exit immediately without doing the session store saving stuff
            // since we want the same state saved except for the update status
            app.exit(0)
          })
          return
        }
      }

      data = module.exports.runPostMigrations(data)
    }

    data = setVersionInformation(data)

    locale.init(data.settings[settings.LANGUAGE]).then((locale) => {
      app.setLocale(locale)
      resolve(data)
    })
  })
}

/**
 * Called when session is suspected for corruption; this will move it out of the way
 */
module.exports.backupSession = () => {
  const src = getStoragePath()
  const dest = getTempStoragePath('backup')

  if (fs.existsSync(src)) {
    try {
      fs.copySync(src, dest)
      console.log('An error occurred. For support purposes, file "' + src + '" has been copied to "' + dest + '".')
    } catch (e) {
      console.log('backupSession: error making copy of session file: ', e)
    }
  }
}

/**
 * Obtains the default application level state
 */
module.exports.defaultAppState = () => {
  return {
    firstRunTimestamp: new Date().getTime(),
    sync: {
      lastFetchTimestamp: 0
    },
    sites: getTopSiteMap(),
    tabs: [],
    windows: [],
    extensions: {},
    visits: [],
    settings: {},
    siteSettings: {},
    passwords: [],
    notifications: [],
    temporarySiteSettings: {},
    dictionary: {
      addedWords: [],
      ignoredWords: []
    },
    autofill: {
      addresses: {
        guid: [],
        timestamp: 0
      },
      creditCards: {
        guid: [],
        timestamp: 0
      }
    },
    menubar: {},
    about: {
      newtab: {
        gridLayoutSize: 'small',
        sites: topSites,
        ignoredTopSites: [],
        pinnedTopSites: pinnedTopSites
      }
    },
    defaultWindowParams: {}
  }
}

/**
 * Determines if a protocol is handled.
 * app.on('ready') must have been fired before this is called.
 */
module.exports.isProtocolHandled = (protocol) => {
  protocol = (protocol || '').split(':')[0]
  return navigatableTypes.includes(`${protocol}:`) ||
      electron.session.defaultSession.protocol.isNavigatorProtocolHandled(protocol)
}
