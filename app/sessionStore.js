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
const fs = require('fs')
const path = require('path')
const electron = require('electron')
const app = electron.app
const locale = require('./locale')
const UpdateStatus = require('../js/constants/updateStatus')
const settings = require('../js/constants/settings')
const downloadStates = require('../js/constants/downloadStates')
const {tabFromFrame} = require('../js/state/frameStateUtil')
const siteUtil = require('../js/state/siteUtil')
const sessionStorageVersion = 1
const filtering = require('./filtering')
const autofill = require('./autofill')
// const tabState = require('./common/state/tabState')

const getSetting = require('../js/settings').getSetting
const promisify = require('../js/lib/promisify')
const sessionStorageName = `session-store-${sessionStorageVersion}`

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
      module.exports.cleanAppData(payload, isShutdown)
      payload.cleanedOnShutdown = isShutdown
    } catch (e) {
      payload.cleanedOnShutdown = false
    }
    payload.lastAppVersion = app.getVersion()

    const epochTimestamp = (new Date()).getTime().toString()
    const tmpStoragePath = process.env.NODE_ENV !== 'test'
      ? path.join(app.getPath('userData'), 'session-store-tmp-' + epochTimestamp)
      : path.join(process.env.HOME, '.brave-test-session-store-tmp-' + epochTimestamp)

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
  // Don't save preview tab pages
  if (perWindowData.ui && perWindowData.ui.tabs) {
    delete perWindowData.ui.tabs.previewTabPageIndex
  }
  // Don't restore add/edit dialog
  delete perWindowData.bookmarkDetail
  // Don't restore bravery panel
  delete perWindowData.braveryPanelDetail
  // Don't restore cache clearing popup
  delete perWindowData.clearBrowsingDataDetail
  // Don't restore drag data
  if (perWindowData.ui) {
    delete perWindowData.ui.dragging
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
    // Full history is not saved yet
    frame.canGoBack = false
    frame.canGoForward = false

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
      frame.navbar.urlbar.urlPreview = null
      if (frame.navbar.urlbar.suggestions) {
        frame.navbar.urlbar.suggestions.selectedIndex = null
        frame.navbar.urlbar.suggestions.suggestionList = null
      }
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
  if (data.settings) {
    // useragent value gets recalculated on restart
    data.settings[settings.USERAGENT] = undefined
  }
  // Don't show notifications from the last session
  data.notifications = []
  // Delete temp site settings
  data.temporarySiteSettings = {}
  // Delete Flash state since this is checked on startup
  delete data.flashInitialized
  if (data.settings[settings.CHECK_DEFAULT_ON_STARTUP] === true) {
    // Delete defaultBrowserCheckComplete state since this is checked on startup
    delete data.defaultBrowserCheckComplete
  }
  // Delete Recovery status on shut down
  try {
    delete data.ui.about.preferences.recoverySucceeded
  } catch (e) {}
  // We used to store a huge list of IDs but we didn't use them.
  // Get rid of them here.
  delete data.windows
  if (data.perWindowState) {
    data.perWindowState.forEach((perWindowState) =>
      module.exports.cleanPerWindowData(perWindowState, isShutdown))
  }
  const clearAutocompleteData = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA) === true
  if (clearAutocompleteData) {
    autofill.clearAutocompleteData()
  }
  const clearAutofillData = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_AUTOFILL_DATA) === true
  if (clearAutofillData) {
    autofill.clearAutofillData()
    const date = new Date().getTime()
    data.autofill.addresses.guid = []
    data.autofill.addresses.timestamp = date
    data.autofill.creditCards.guid = []
    data.autofill.creditCards.timestamp = date
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
  // all data in tabs is transient while we make the transition from window to app state
  delete data.tabs
  // if (data.tabs) {
  //   data.tabs = data.tabs.map((tab) => tabState.getPersistentTabState(tab).toJS())
  // }
  if (data.extensions) {
    Object.keys(data.extensions).forEach((extensionId) => {
      delete data.extensions[extensionId].tabs
    })
  }
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

    try {
      data = JSON.parse(data)
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
      // Clean app data here if it wasn't cleared on shutdown
      if (data.cleanedOnShutdown !== true || data.lastAppVersion !== app.getVersion()) {
        module.exports.cleanAppData(data, false)
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
    } catch (e) {
      // TODO: Session state is corrupted, maybe we should backup this
      // corrupted value for people to report into support.
      console.log('could not parse data: ', data)
      data = exports.defaultAppState()
    }
    locale.init(data.settings[settings.LANGUAGE]).then((locale) => {
      app.setLocale(locale)
      resolve(data)
    })
  })
}

/**
 * Obtains the default application level state
 */
module.exports.defaultAppState = () => {
  return {
    firstRunTimestamp: new Date().getTime(),
    sites: [],
    tabs: [],
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
        sites: [],
        ignoredTopSites: [],
        pinnedTopSites: []
      }
    }
  }
}
