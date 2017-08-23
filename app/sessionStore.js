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
const path = require('path')
const electron = require('electron')
const os = require('os')
const assert = require('assert')
const app = electron.app
const locale = require('./locale')
const UpdateStatus = require('../js/constants/updateStatus')
const settings = require('../js/constants/settings')
const downloadStates = require('../js/constants/downloadStates')
const siteUtil = require('../js/state/siteUtil')
const { topSites, pinnedTopSites } = require('../js/data/newTabData')
const { defaultSiteSettingsList } = require('../js/data/siteSettingsList')
const sessionStorageVersion = 1
const filtering = require('./filtering')
const autofill = require('./autofill')
const {navigatableTypes} = require('../js/lib/appUrlUtil')
const Channel = require('./channel')
const {isList, isMap, isImmutable, makeImmutable, deleteImmutablePaths} = require('./common/state/immutableUtil')
const tabState = require('./common/state/tabState')
const windowState = require('./common/state/windowState')

const platformUtil = require('./common/lib/platformUtil')
const getSetting = require('../js/settings').getSetting
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
 * @param {object} immutablePayload - Application immutable state as per
 *   https://github.com/brave/browser/wiki/Application-State
 *   (not immutable data)
 * @return a promise which resolves when the state is saved
 */
module.exports.saveAppState = (immutablePayload, isShutdown) => {
  assert(isImmutable(immutablePayload))

  return new Promise((resolve, reject) => {
    // Don't persist private frames
    let startupModeSettingValue = getSetting(settings.STARTUP_MODE)
    const savePerWindowState = startupModeSettingValue == null ||
      startupModeSettingValue === 'lastTime'
    if (immutablePayload.get('perWindowState') && savePerWindowState) {
      immutablePayload.get('perWindowState').forEach((immutableWndPayload, i) => {
        const frames = immutableWndPayload.get('frames').filter((frame) => !frame.get('isPrivate'))
        immutableWndPayload = immutableWndPayload.set('frames', frames)
        immutablePayload = immutablePayload.setIn(['perWindowState', i], immutableWndPayload)
      })
    } else {
      immutablePayload = immutablePayload.delete('perWindowState')
    }

    try {
      immutablePayload = module.exports.cleanAppData(immutablePayload, isShutdown)
      immutablePayload = immutablePayload.set('cleanedOnShutdown', isShutdown)
    } catch (e) {
      immutablePayload = immutablePayload.set('cleanedOnShutdown', false)
    }
    immutablePayload = immutablePayload.set('lastAppVersion', app.getVersion())

    if (isShutdown) {
      module.exports.cleanSessionDataOnShutdown()
    }

    const storagePath = getStoragePath()
    const json = JSON.stringify(immutablePayload)
    muon.file.writeImportant(storagePath, json, (success) => {
      if (success) {
        resolve()
      } else {
        reject(new Error('Could not save app state to ' + getStoragePath()))
      }
    })
  })
}

/**
 * Cleans session data from unwanted values.
 * @param immutablePerWindowData - Per window data in ImmutableJS format
 * @return ImmutableJS cleaned window data
 */
module.exports.cleanPerWindowData = (immutablePerWindowData, isShutdown) => {
  if (!immutablePerWindowData) {
    immutablePerWindowData = Immutable.Map()
  }

  assert(isImmutable(immutablePerWindowData))

  // delete the frame index because tabId is per-session
  immutablePerWindowData = immutablePerWindowData.delete('framesInternal')

  immutablePerWindowData = deleteImmutablePaths(immutablePerWindowData, [
    // Hide the context menu when we restore.
    'contextMenuDetail',
    // Don't save preview frame since they are only related to hovering on a tab
    'previewFrameKey',
    // Don't save widevine panel detail
    'widevinePanelDetail',
    // Don't save preview tab pages
    ['ui', 'tabs', 'previewTabPageIndex'],
    // Don't restore add/edit dialog
    'bookmarkDetail',
    // Don't restore bravery panel
    'braveryPanelDetail',
    // Don't restore drag data and clearBrowsingDataPanel's visibility
    // This is no longer stored, we can remove this line eventually
    ['ui', 'isFocused'],
    ['ui', 'mouseInTitlebar'],
    ['ui', 'mouseInFrame'],
    ['ui', 'dragging'],
    ['ui', 'isClearBrowsingDataPanelVisible']
  ])

  if (!immutablePerWindowData.get('frames')) {
    immutablePerWindowData = immutablePerWindowData.set('frames', Immutable.List())
  }

  let newKey = 0
  let activeFrameKey = immutablePerWindowData.get('activeFrameKey')
  // If adjustActive is set to true then activeFrameKey will be set to the new frame key.
  // We re-use this function for both closedFrames and frames, and we only want to adjust the active for frames.
  const cleanFrame = (immutableFrame, adjustActive) => {
    newKey++
    // Reset the ids back to sequential numbers
    if (adjustActive &&
        immutableFrame.get('key') === immutablePerWindowData.get('activeFrameKey')) {
      activeFrameKey = newKey
    } else {
      // For now just set everything to unloaded unless it's the active frame
      immutableFrame = immutableFrame.set('unloaded', true)
    }
    immutableFrame = immutableFrame.set('key', newKey)

    // Set the frame src to the last visited location
    // or else users will see the first visited URL.
    // Pinned location always get reset to what they are
    immutableFrame = immutableFrame.set('src', immutableFrame.get('pinnedLocation') || immutableFrame.get('location'))

    // If a blob is present for the thumbnail, create the object URL
    if (immutableFrame.get('thumbnailBlob')) {
      try {
        immutableFrame = immutableFrame.set('thumbnailUrl', window.URL.createObjectURL(immutableFrame.get('thumbnailBlob')))
      } catch (e) {
        immutableFrame = immutableFrame.delete('thumbnailUrl')
      }
    }

    immutableFrame = deleteImmutablePaths(immutableFrame, [
      // Delete lists of blocked sites
      'trackingProtection',
      'httpsEverywhere',
      'adblock',
      'noScript',
      // clean up any legacy frame opening props
      'openInForeground',
      'disposition',
      // Guest instance ID's are not valid after restarting.
      // Electron won't know about them.
      'guestInstanceId',
      // Tab ids are per-session and should not be persisted
      'tabId',
      'openerTabId',
      // Do not show the audio indicator until audio starts playing
      'audioMuted',
      'audioPlaybackActive',
      // Let's not assume wknow anything about loading
      'loading',
      // Always re-determine the security data
      'security',
      // Value is only used for local storage
      'isActive',
      // Hide modal prompts.
      'modalPromptDetail',
      // Remove HTTP basic authentication requests.
      'basicAuthDetail',
      // Remove open search details
      'searchDetail',
      // Remove find in page details
      ['findDetail', 'numberOfMatches'],
      ['findDetail', 'activeMatchOrdinal'],
      ['findDetail', 'internalFindStatePresent'],
      'findbarShown',
      // Don't restore full screen state
      'isFullScreen',
      'showFullScreenWarning',
      // Don't store child tab open ordering since keys
      // currently get re-generated when session store is
      // restored.  We will be able to keep this once we
      // don't regenerate new frame keys when opening storage.
      'parentFrameKey',
      // Delete the active shortcut details
      'activeShortcut',
      'activeShortcutDetails'
    ])

    if (immutableFrame.get('navbar') && immutableFrame.getIn(['navbar', 'urlbar'])) {
      if (immutableFrame.getIn(['navbar', 'urlbar', 'suggestions'])) {
        immutableFrame = immutableFrame.setIn(['navbar', 'urlbar', 'suggestions', 'selectedIndex'], null)
        immutableFrame = immutableFrame.setIn(['navbar', 'urlbar', 'suggestions', 'suggestionList'], null)
      }
      immutableFrame = immutableFrame.deleteIn(['navbar', 'urlbar', 'searchDetail'])
    }
    return immutableFrame
  }
  const clearHistory = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_HISTORY) === true
  if (clearHistory) {
    immutablePerWindowData = immutablePerWindowData.set('closedFrames', Immutable.List())
  }

  // Clean closed frame data before frames because the keys are re-ordered
  // and the new next key is calculated in windowStore.js based on
  // the max frame key ID.
  if (immutablePerWindowData.get('closedFrames')) {
    immutablePerWindowData =
      immutablePerWindowData.get('closedFrames').reduce((immutablePerWindowData, immutableFrame, index) => {
        const cleanImmutableFrame = cleanFrame(immutableFrame, false)
        return immutablePerWindowData.setIn(['closedFrames', index], cleanImmutableFrame)
      }, immutablePerWindowData)
  }
  let immutableFrames = immutablePerWindowData.get('frames')
  if (immutableFrames) {
    // Don't restore pinned locations because they will be auto created by the app state change event
    immutableFrames = immutableFrames
        .filter((frame) => !frame.get('pinnedLocation'))
    immutablePerWindowData = immutablePerWindowData.set('frames', immutableFrames)
    immutablePerWindowData =
      immutableFrames.reduce((immutablePerWindowData, immutableFrame, index) => {
        const cleanImmutableFrame = cleanFrame(immutableFrame, true)
        return immutablePerWindowData.setIn(['frames', index], cleanImmutableFrame)
      }, immutablePerWindowData)
    if (activeFrameKey !== undefined) {
      immutablePerWindowData = immutablePerWindowData.set('activeFrameKey', activeFrameKey)
    }
  }
  return immutablePerWindowData
}

/**
 * Cleans app data before it's written to disk.
 * @param {Object} data - top-level app data in ImmutableJS format
 * @param {Object} isShutdown - true if the data is being cleared for a shutdown
 * WARNING: getPrefs is only available in this function when isShutdown is true
 * @return Immutable JS cleaned up data
 */
module.exports.cleanAppData = (immutableData, isShutdown) => {
  assert(isImmutable(immutableData))

  // Don't show notifications from the last session
  immutableData = immutableData.set('notifications', Immutable.List())
  // Delete temp site settings
  immutableData = immutableData.set('temporarySiteSettings', Immutable.Map())

  if (immutableData.getIn(['settings', settings.CHECK_DEFAULT_ON_STARTUP]) === true) {
    // Delete defaultBrowserCheckComplete state since this is checked on startup
    immutableData = immutableData.delete('defaultBrowserCheckComplete')
  }
  // Delete Recovery status on shut down
  try {
    immutableData = immutableData.deleteIn(['ui', 'about', 'preferences', 'recoverySucceeded'])
  } catch (e) {}

  const perWindowStateList = immutableData.get('perWindowState')
  if (perWindowStateList) {
    perWindowStateList.forEach((immutablePerWindowState, i) => {
      const cleanedImmutablePerWindowState = module.exports.cleanPerWindowData(immutablePerWindowState, isShutdown)
      immutableData = immutableData.setIn(['perWindowState', i], cleanedImmutablePerWindowState)
    })
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
    immutableData = immutableData.set('autofill', Immutable.fromJS({
      addresses: {
        guid: [],
        timestamp: date
      },
      creditCards: {
        guid: [],
        timestamp: date
      }
    }))
  }
  immutableData = immutableData.delete('dragData')

  if (immutableData.get('sync')) {
    // clear sync site cache
    immutableData = immutableData.deleteIn(['sync', 'objectsById'], Immutable.Map())
  }
  const clearSiteSettings = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_SITE_SETTINGS) === true
  if (clearSiteSettings) {
    immutableData = immutableData.set('siteSettings', Immutable.Map())
  }
  // Delete expired Flash and NoScript allow-once approvals
  let now = Date.now()

  immutableData.get('siteSettings', Immutable.Map()).forEach((value, host) => {
    let expireTime = value.get('flash')
    if (typeof expireTime === 'number' && expireTime < now) {
      immutableData = immutableData.deleteIn(['siteSettings', host, 'flash'])
    }
    let noScript = immutableData.getIn(['siteSettings', host, 'noScript'])
    if (typeof noScript === 'number') {
      immutableData = immutableData.deleteIn(['siteSettings', host, 'noScript'])
    }
    // Don't persist any noScript exceptions
    immutableData = immutableData.deleteIn(['siteSettings', host, 'noScriptExceptions'])
    // Don't write runInsecureContent to session
    immutableData = immutableData.deleteIn(['siteSettings', host, 'runInsecureContent'])
    // If the site setting is empty, delete it for privacy
    if (Array.from(immutableData.getIn(['siteSettings', host]).keys()).length === 0) {
      immutableData = immutableData.deleteIn(['siteSettings', host])
    }
  })

  if (immutableData.get('sites')) {
    const clearHistory = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_HISTORY) === true
    if (clearHistory) {
      const sitesAfterClearHistory = siteUtil.clearHistory(immutableData.get('sites'))
      immutableData = immutableData.set('sites', sitesAfterClearHistory)
      immutableData = immutableData.set('historySites', Immutable.Map())
      immutableData = deleteImmutablePaths(immutableData, [
        ['about', 'history'],
        ['about', 'newtab']
      ])
    }
  }

  if (immutableData.get('downloads')) {
    const clearDownloads = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_DOWNLOADS) === true
    if (clearDownloads) {
      immutableData = immutableData.delete('downloads')
    } else {
      // Always at least delete downloaded items older than a week
      const dateOffset = 7 * 24 * 60 * 60 * 1000
      const lastWeek = new Date().getTime() - dateOffset
      Array.from(immutableData.get('downloads').keys()).forEach((downloadId) => {
        if (immutableData.getIn(['downloads', downloadId, 'startTime']) < lastWeek) {
          immutableData = immutableData.deleteIn(['downloads', downloadId])
        } else {
          const state = immutableData.getIn(['downloads', downloadId, 'state'])
          if (state === downloadStates.IN_PROGRESS || state === downloadStates.PAUSED) {
            immutableData = immutableData.setIn(['downloads', downloadId, 'state'], downloadStates.INTERRUPTED)
          }
        }
      })
    }
  }

  immutableData = immutableData.delete('menu')

  try {
    immutableData = tabState.getPersistentState(immutableData)
  } catch (e) {
    console.log('cleanAppData: error calling tabState.getPersistentState: ', e)
    immutableData = immutableData.set('tabs', Immutable.List())
  }

  try {
    immutableData = windowState.getPersistentState(immutableData)
  } catch (e) {
    console.log('cleanAppData: error calling windowState.getPersistentState: ', e)
    immutableData = immutableData.set('windows', Immutable.List())
  }

  if (immutableData.get('extensions')) {
    Array.from(immutableData.get('extensions').keys()).forEach((extensionId) => {
      immutableData = immutableData.deleteIn(['extensions', extensionId, 'tabs'])
    })
  }
  return immutableData
}

/**
 * Cleans session data on shutdown if the prefs are on.
 * @return a promise which resolve when the work is done.
 */
module.exports.cleanSessionDataOnShutdown = () => {
  if (getSetting(settings.SHUTDOWN_CLEAR_ALL_SITE_COOKIES) === true) {
    filtering.clearStorageData()
  }
  if (getSetting(settings.SHUTDOWN_CLEAR_CACHE) === true) {
    filtering.clearCache()
  }
  if (getSetting(settings.SHUTDOWN_CLEAR_HISTORY) === true) {
    filtering.clearHistory()
  }
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
const setVersionInformation = (immutableData) => {
  const versionFields = [
    ['Brave', app.getVersion],
    ['rev', Channel.browserLaptopRev],
    ['Muon', () => { return process.versions['atom-shell'] }],
    ['libchromiumcontent', () => { return process.versions['chrome'] }],
    ['V8', () => { return process.versions.v8 }],
    ['Node.js', () => { return process.versions.node }],
    ['Update Channel', Channel.channel],
    ['OS Platform', () => platformUtil.formatOsPlatform(os.platform())],
    ['OS Release', os.release],
    ['OS Architecture', os.arch]
  ]
  const versionInformation = []

  versionFields.forEach((field) => {
    versionInformation.push(safeGetVersion(field[0], field[1]))
  })

  if (!immutableData.get('about')) {
    immutableData = immutableData.set('about', Immutable.Map())
  }
  immutableData = immutableData.setIn(['about', 'brave', 'versionInformation'], Immutable.fromJS(versionInformation))
  return immutableData
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

module.exports.runPostMigrations = (immutableData) => {
  // sites refactoring migration
  let oldSites = immutableData.get('sites')
  if (isList(oldSites) && oldSites.size) {
    let newSites = Immutable.List()
    let order = 0
    oldSites.forEach((site) => {
      let key = siteUtil.getSiteKey(site)
      site.order = order++
      newSites = newSites.set(key, site)
    })
    immutableData = immutableData.set('sites', newSites)
  }

  // sites trailing slash migration
  oldSites = immutableData.get('sites')

  if (isMap(oldSites)) {
    const keys = Array.from(oldSites.keys())
    for (let key of keys) {
      if (/^http.+\/\|\d+\|\d+/.test(key)) {
        const site = oldSites.get(key)
        const newKey = siteUtil.getSiteKey(site)
        if (!newKey) {
          continue
        }
        immutableData = immutableData.setIn(['sites', newKey], site)
        immutableData = immutableData.deleteIn(['sites', key])
      }
    }
  }

  return immutableData
}

module.exports.runImportDefaultSettings = (data) => {
  // import default site settings list
  if (!data.defaultSiteSettingsListImported) {
    for (var i = 0; i < defaultSiteSettingsList.length; ++i) {
      let setting = defaultSiteSettingsList[i]
      if (!data.siteSettings[setting.pattern]) {
        data.siteSettings[setting.pattern] = {}
      }
      let targetSetting = data.siteSettings[setting.pattern]
      if (!targetSetting.hasOwnProperty[setting.name]) {
        targetSetting[setting.name] = setting.value
      }
    }
    data.defaultSiteSettingsListImported = true
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
    const fs = require('fs')

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
      data = {}
    }

    data = Object.assign({}, module.exports.defaultAppState(), data)
    data = module.exports.runImportDefaultSettings(data)
    if (loaded) {
      data = module.exports.runPreMigrations(data)
    }

    let immutableData = makeImmutable(data)
    if (loaded) {
      // Clean app data here if it wasn't cleared on shutdown
      if (immutableData.get('cleanedOnShutdown') !== true || immutableData.get('lastAppVersion') !== app.getVersion()) {
        immutableData = module.exports.cleanAppData(immutableData, false)
      }

      immutableData = immutableData.set('cleanedOnShutdown', false)

      // Always recalculate the update status
      if (immutableData.get('updates')) {
        const updateStatus = immutableData.getIn(['updates', 'status'])
        immutableData = immutableData.deleteIn(['updates', 'status'])
        // The process always restarts after an update so if the state
        // indicates that a restart isn't wanted, close right away.
        if (updateStatus === UpdateStatus.UPDATE_APPLYING_NO_RESTART) {
          module.exports.saveAppState(immutableData, true).then(() => {
            // Exit immediately without doing the session store saving stuff
            // since we want the same state saved except for the update status
            app.exit(0)
          })
          return
        }
      }

      immutableData = module.exports.runPostMigrations(immutableData)
    }
    immutableData = setVersionInformation(immutableData)
    locale.init(immutableData.getIn(['settings', settings.LANGUAGE])).then((locale) => {
      app.setLocale(locale)
      resolve(immutableData)
    })
  })
}

/**
 * Called when session is suspected for corruption; this will move it out of the way
 */
module.exports.backupSession = () => {
  const fs = require('fs-extra')
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
      devices: {},
      lastFetchTimestamp: 0,
      objectsById: {},
      pendingRecords: {},
      lastConfirmedRecordTimestamp: 0
    },
    locationSiteKeysCache: undefined,
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
      },
      welcome: {
        showOnLoad: !['test', 'development'].includes(process.env.NODE_ENV)
      }
    },
    trackingProtection: {
      count: 0
    },
    adblock: {
      count: 0
    },
    httpsEverywhere: {
      count: 0
    },
    defaultWindowParams: {},
    searchDetail: null
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
