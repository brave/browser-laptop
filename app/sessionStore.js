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

const path = require('path')
const electron = require('electron')
const os = require('os')
const assert = require('assert')
const Immutable = require('immutable')
const app = electron.app
const compareVersions = require('compare-versions')
const merge = require('deepmerge')
const {execSync} = require('child_process')

// Constants
const UpdateStatus = require('../js/constants/updateStatus')
const settings = require('../js/constants/settings')
const siteTags = require('../js/constants/siteTags')
const downloadStates = require('../js/constants/downloadStates')
const ledgerStatuses = require('./common/constants/ledgerStatuses')
const promotionStatuses = require('./common/constants/promotionStatuses')

// State
const tabState = require('./common/state/tabState')
const windowState = require('./common/state/windowState')
const ledgerState = require('./common/state/ledgerState')

// Utils
const locale = require('./locale')
const {defaultSiteSettingsList} = require('../js/data/siteSettingsList')
const filtering = require('./filtering')
const autofill = require('./autofill')
const {navigatableTypes} = require('../js/lib/appUrlUtil')
const {isDataUrl, parseFaviconDataUrl} = require('../js/lib/urlutil')
const Channel = require('./channel')
const BuildConfig = require('./buildConfig')
const {isImmutable, makeImmutable, deleteImmutablePaths} = require('./common/state/immutableUtil')
const {getSetting} = require('../js/settings')
const platformUtil = require('./common/lib/platformUtil')
const historyUtil = require('./common/lib/historyUtil')

const sessionStorageVersion = 1
const sessionStorageName = `session-store-${sessionStorageVersion}`

const getTempStoragePath = (filename) => {
  const epochTimestamp = (new Date()).getTime().toString()
  filename = filename || 'tmp'
  return process.env.NODE_ENV !== 'test'
    ? path.join(app.getPath('userData'), 'session-store-' + filename + '-' + epochTimestamp)
    : path.join(process.env.HOME, '.brave-test-session-store-' + filename + '-' + epochTimestamp)
}

const getStoragePath = (filename = sessionStorageName) => {
  return path.join(app.getPath('userData'), filename)
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
    let startupModeSettingValue = getSetting(settings.STARTUP_MODE)
    const savePerWindowState = startupModeSettingValue == null ||
      startupModeSettingValue === 'lastTime'

    // Don't persist private frames
    if (immutablePayload.get('perWindowState')) {
      if (savePerWindowState) {
        immutablePayload.get('perWindowState').forEach((immutableWndPayload, i) => {
          let frames = immutableWndPayload.get('frames')
          if (frames) {
            frames = frames.filter((frame) => !frame.get('isPrivate'))
          }
          immutableWndPayload = immutableWndPayload.set('frames', frames)
          immutablePayload = immutablePayload.setIn(['perWindowState', i], immutableWndPayload)
        })
      } else {
        // we still need to preserve window position/size info
        immutablePayload.get('perWindowState').forEach((immutableWndPayload, i) => {
          let windowInfo = Immutable.Map()
          windowInfo = windowInfo.set('windowInfo', immutableWndPayload.get('windowInfo'))
          immutablePayload = immutablePayload.setIn(['perWindowState', i], windowInfo)
        })
      }
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
      'parentFrameKey'
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
  let closedFrames = immutablePerWindowData.get('closedFrames')
  if (closedFrames) {
    closedFrames = closedFrames.filter((frame) => frame)
    immutablePerWindowData = immutablePerWindowData.set('closedFrames', closedFrames)
    // clean each frame
    immutablePerWindowData =
      closedFrames.reduce((immutablePerWindowData, immutableFrame, index) => {
        const cleanImmutableFrame = cleanFrame(immutableFrame, false)
        return immutablePerWindowData.setIn(['closedFrames', index], cleanImmutableFrame)
      }, immutablePerWindowData)
  }
  let frames = immutablePerWindowData.get('frames')
  if (frames) {
    // Don't restore pinned locations because they will be auto created by the app state change event
    frames = frames.filter((frame) => frame && !frame.get('pinnedLocation'))
    immutablePerWindowData = immutablePerWindowData.set('frames', frames)
    // clean each frame
    immutablePerWindowData =
      frames.reduce((immutablePerWindowData, immutableFrame, index) => {
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
  // Delete Tor init state
  immutableData = immutableData.set('tor', Immutable.Map())

  if (immutableData.getIn(['settings', settings.CHECK_DEFAULT_ON_STARTUP]) === true) {
    // Delete defaultBrowserCheckComplete state since this is checked on startup
    immutableData = immutableData.delete('defaultBrowserCheckComplete')
  }
  // Delete Recovery status on shut down
  try {
    immutableData = immutableData.deleteIn(['ui', 'about', 'preferences', 'recoverySucceeded'])
  } catch (e) {}

  let perWindowStateList = immutableData.get('perWindowState')
  if (perWindowStateList) {
    // Clean window state (e.g. remove private tabs and UI state)
    perWindowStateList = perWindowStateList.map(
      (immutablePerWindowState) => module.exports.cleanPerWindowData(immutablePerWindowState, isShutdown)
    )
    // Do not save window state if it has no tabs,
    // e.g. if the only tabs were private tabs, or the window was a buffer window.
    perWindowStateList = perWindowStateList.filter(
      (immutablePerWindowState) => immutablePerWindowState.hasIn(['frames', 0])
    )
    immutableData = immutableData.set('perWindowState', perWindowStateList)
  }
  const clearAutocompleteData = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA) === true
  if (clearAutocompleteData) {
    try {
      autofill.clearAutocompleteData()
    } catch (e) {
      console.error('cleanAppData: error calling autofill.clearAutocompleteData: ', e)
    }
  }

  const clearSynopsis = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_PUBLISHERS) === true
  const inProgress = ledgerState.getAboutProp(immutableData, 'status') === ledgerStatuses.IN_PROGRESS
  if (clearSynopsis && immutableData.has('ledger') && !inProgress) {
    immutableData = ledgerState.resetPublishers(immutableData)
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

  const clearHistory = isShutdown && getSetting(settings.SHUTDOWN_CLEAR_HISTORY) === true
  if (clearHistory) {
    immutableData = immutableData.set('historySites', Immutable.Map())
    immutableData = deleteImmutablePaths(immutableData, [
      ['about', 'history'],
      ['about', 'newtab']
    ])
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

  if (isShutdown) {
    const status = ledgerState.getPromotionProp(immutableData, 'promotionStatus')
    if (
      status === promotionStatuses.CAPTCHA_CHECK ||
      status === promotionStatuses.CAPTCHA_BLOCK ||
      status === promotionStatuses.CAPTCHA_ERROR
    ) {
      immutableData = ledgerState.setPromotionProp(immutableData, 'promotionStatus', null)
    }
  }

  immutableData = immutableData.delete('menu')
  immutableData = immutableData.delete('pageData')

  try {
    immutableData = tabState.getPersistentState(immutableData)
  } catch (e) {
    console.error('cleanAppData: error calling tabState.getPersistentState: ', e)
    immutableData = immutableData.set('tabs', Immutable.List())
  }

  try {
    immutableData = windowState.getPersistentState(immutableData)
  } catch (e) {
    console.error('cleanAppData: error calling windowState.getPersistentState: ', e)
    immutableData = immutableData.set('windows', Immutable.List())
  }

  if (immutableData.get('extensions')) {
    Array.from(immutableData.get('extensions').keys()).forEach((extensionId) => {
      immutableData = immutableData.deleteIn(['extensions', extensionId, 'tabs'])
    })
  }

  // Ledger cleanup
  if (immutableData.has('pageData')) {
    immutableData = immutableData.delete('pageData')
  }

  if (immutableData.hasIn(['ledger', 'locations'])) {
    immutableData = immutableData.deleteIn(['ledger', 'locations'])
  }

  try {
    // Prune data: favicons by moving them to external files
    const basePath = getStoragePath('ledger-favicons')
    if (immutableData.get('createdFaviconDirectory') !== true) {
      const fs = require('fs')
      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath)
      }
      immutableData = immutableData.set('createdFaviconDirectory', true)
    }
    immutableData = cleanFavicons(basePath, immutableData)
  } catch (e) {
    console.error('cleanAppData: error cleaning up data: urls', e)
  }

  // delete the window ready state (gets set again on program start)
  if (immutableData.has('windowReady')) {
    immutableData = immutableData.delete('windowReady')
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

const cleanFavicons = (basePath, immutableData) => {
  const fs = require('fs')
  const synopsisPaths = [
    // TODO (nejc) - remove duplicate entries in synopsis and about/synopsis
    ['ledger', 'synopsis', 'publishers'],
    ['ledger', 'about', 'synopsis']
  ]
  // Map of favicon content to location on disk to avoid saving dupes
  const savedFavicons = {}
  synopsisPaths.forEach((synopsisPath) => {
    if (immutableData.getIn(synopsisPath)) {
      immutableData.getIn(synopsisPath).forEach((value, index) => {
        // Fix #11582
        if (value && value.get && isDataUrl(value.get('faviconURL', ''))) {
          const parsed = parseFaviconDataUrl(value.get('faviconURL'))
          if (!parsed) {
            immutableData = immutableData.setIn(
              synopsisPath.concat([index, 'faviconURL']), '')
            return
          }
          let faviconPath = savedFavicons[parsed.data]
          if (!faviconPath) {
            faviconPath = path.join(basePath,
              typeof index === 'number'
                ? `${Date.now()}.${parsed.ext}`
                : `${index.replace(/[^a-z0-9]/gi, '_')}.${parsed.ext}`
            )
            savedFavicons[parsed.data] = faviconPath
            fs.writeFile(faviconPath, parsed.data, 'base64', (err) => {
              if (err) {
                console.error(`Error writing file: ${faviconPath} ${err}`)
              }
            })
          }
          immutableData = immutableData.setIn(
            synopsisPath.concat([index, 'faviconURL']), `file://${faviconPath}`)
        }
      })
    }
  })
  return immutableData
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
    console.error('ERROR getting value for field ' + fieldName + ' in sessionStore::setVersionInformation(): ', getFieldVersion, ' is not a function')
  } catch (e) {
    console.error('ERROR getting value for field ' + fieldName + ' in sessionStore::setVersionInformation(): ', e)
  }
  return versionField
}

/**
 * version information (shown on about:brave)
 */
const setVersionInformation = (immutableData) => {
  const versionFields = [
    ['Brave', app.getVersion],
    ['rev', BuildConfig.browserLaptopRev],
    ['Muon', () => { return process.versions['atom-shell'] }],
    ['libchromiumcontent', () => { return process.versions['chrome'] }],
    ['V8', () => { return process.versions.v8 }],
    ['Node.js', () => { return process.versions.node }],
    ['Update Channel', Channel.formattedChannel],
    ['OS Platform', () => platformUtil.formatOsPlatform(os.platform())],
    ['OS Release', os.release],
    ['OS Architecture', os.arch]
  ]
  const versionInformation = {}

  versionFields.forEach((field) => {
    const versionField = safeGetVersion(field[0], field[1])
    versionInformation[versionField.name] = versionField.version
  })

  if (!immutableData.get('about')) {
    immutableData = immutableData.set('about', Immutable.Map())
  }
  immutableData = immutableData.setIn(['about', 'brave', 'versionInformation'], Immutable.fromJS(versionInformation))
  return immutableData
}

const sortBookmarkOrder = (bookmarkOrder) => {
  const newOrder = {}
  for (let key of Object.keys(bookmarkOrder)) {
    let i = 0
    const order = bookmarkOrder[key].sort((x, y) => {
      if (x.order < y.order) {
        return -1
      } else if (x.order > y.order) {
        return 1
      } else {
        return 0
      }
    }).map(item => {
      item.order = i
      i++
      return item
    })

    newOrder[key] = order
  }

  return newOrder
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
    if (data.autofill.addresses && data.autofill.addresses.guid) {
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
    if (data.autofill.creditCards && data.autofill.creditCards.guid) {
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
  if (data.settings) {
    // xml migration
    if (data.settings[settings.DEFAULT_SEARCH_ENGINE] === 'content/search/google.xml') {
      data.settings[settings.DEFAULT_SEARCH_ENGINE] = 'Google'
    }
    if (data.settings[settings.DEFAULT_SEARCH_ENGINE] === 'content/search/duckduckgo.xml') {
      data.settings[settings.DEFAULT_SEARCH_ENGINE] = 'DuckDuckGo'
    }
    // ledger payments migration. see PR #10164
    // changes was introduced in 0.21.x.
    // if legacy setting exist, make sure the new setting inherits the legacy value
    if (data.settings[settings.AUTO_SUGGEST_SITES] != null) {
      data.settings[settings.PAYMENTS_SITES_AUTO_SUGGEST] = data.settings[settings.AUTO_SUGGEST_SITES]
      delete data.settings[settings.AUTO_SUGGEST_SITES]
    }
    if (data.settings[settings.MINIMUM_VISIT_TIME] != null) {
      data.settings[settings.PAYMENTS_MINIMUM_VISIT_TIME] = data.settings[settings.MINIMUM_VISIT_TIME]
      delete data.settings[settings.MINIMUM_VISIT_TIME]
    }
    if (data.settings[settings.MINIMUM_VISITS] != null) {
      data.settings[settings.PAYMENTS_MINIMUM_VISITS] = data.settings[settings.MINIMUM_VISITS]
      delete data.settings[settings.MINIMUM_VISITS]
    }
    if (data.settings[settings.HIDE_LOWER_SITES] != null) {
      data.settings[settings.PAYMENTS_SITES_SHOW_LESS] = data.settings[settings.HIDE_LOWER_SITES]
      delete data.settings[settings.HIDE_LOWER_SITES]
    }
    if (data.settings[settings.HIDE_EXCLUDED_SITES] != null) {
      data.settings[settings.PAYMENTS_SITES_HIDE_EXCLUDED] = data.settings[settings.HIDE_EXCLUDED_SITES]
      delete data.settings[settings.HIDE_EXCLUDED_SITES]
    }
    // PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED kept the same
    // constant but has its value changed.
    if (data.settings['payments.notificationTryPaymentsDismissed'] != null) {
      data.settings[settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED] = data.settings['payments.notificationTryPaymentsDismissed']
      delete data.settings['payments.notificationTryPaymentsDismissed']
    }
  }

  if (data.sites) {
    // pinned sites
    data.pinnedSites = {}
    // get pre-site split pinned sites, in order
    const sitesToPin = Object.keys(data.sites)
      .map(key => data.sites[key])
      .filter(site => site.tags && site.tags.includes('pinned'))
      .sort((a, b) => a.order - b.order)
    for (const site of sitesToPin) {
      // convert to new format (split to its own pinnedSites key)
      // reset 'order', same as pinnedSitesState
      const pinnedSite = Object.assign({}, site, { order: Object.keys(data.pinnedSites).length })
      delete pinnedSite.tags
      // matches `getKey` from pinnedSitesUtil
      const pinnedSiteKey = `${site.location}|${site.partitionNumber}`
      data.pinnedSites[pinnedSiteKey] = pinnedSite
    }

    // default sites
    let newTab = data.about.newtab

    if (newTab) {
      const ignoredSites = []
      const pinnedSites = []

      if (newTab.ignoredTopSites) {
        for (let site of newTab.ignoredTopSites) {
          if (site) {
            ignoredSites.push(`${site.location}|0|0`)
          }
        }
        data.about.newtab.ignoredTopSites = ignoredSites
      }

      if (newTab.pinnedTopSites) {
        for (let site of newTab.pinnedTopSites) {
          if (site) {
            site.key = `${site.location}|0|0`
            pinnedSites.push(site)
          }
        }
        data.about.newtab.pinnedTopSites = pinnedSites
      }

      data.about.newtab.sites = []
    }

    // bookmark order
    let bookmarkOrder = {}

    // bookmark folders
    data.bookmarkFolders = {}
    for (let key of Object.keys(data.sites)) {
      const oldFolder = data.sites[key]
      if (oldFolder.tags && oldFolder.tags.includes(siteTags.BOOKMARK_FOLDER)) {
        let folder = {}
        key = key.toString()

        if (oldFolder.customTitle) {
          folder.title = oldFolder.customTitle
        } else {
          folder.title = oldFolder.title
        }

        if (oldFolder.parentFolderId == null) {
          folder.parentFolderId = 0
        } else {
          folder.parentFolderId = oldFolder.parentFolderId
        }

        folder.folderId = oldFolder.folderId
        folder.partitionNumber = oldFolder.partitionNumber
        folder.objectId = oldFolder.objectId
        folder.type = siteTags.BOOKMARK_FOLDER
        folder.key = key
        data.bookmarkFolders[key] = folder

        // bookmark order
        const id = folder.parentFolderId.toString()
        if (!bookmarkOrder[id]) {
          bookmarkOrder[id] = []
        }

        bookmarkOrder[id].push({
          key: key,
          order: oldFolder.order,
          type: siteTags.BOOKMARK_FOLDER
        })
      }
    }

    // bookmarks
    data.bookmarks = {}

    for (let key of Object.keys(data.sites)) {
      const oldBookmark = data.sites[key]
      if (oldBookmark.tags && oldBookmark.tags.includes(siteTags.BOOKMARK)) {
        let bookmark = {}

        if (oldBookmark.customTitle && oldBookmark.customTitle.length > 0) {
          bookmark.title = oldBookmark.customTitle
        } else {
          bookmark.title = oldBookmark.title
        }

        if (oldBookmark.parentFolderId == null) {
          bookmark.parentFolderId = 0
        } else {
          bookmark.parentFolderId = oldBookmark.parentFolderId
        }

        bookmark.location = oldBookmark.location
        bookmark.partitionNumber = oldBookmark.partitionNumber
        bookmark.objectId = oldBookmark.objectId
        bookmark.favicon = oldBookmark.favicon
        bookmark.themeColor = oldBookmark.themeColor
        bookmark.type = siteTags.BOOKMARK
        bookmark.key = key
        data.bookmarks[key] = bookmark

        // bookmark order
        const id = bookmark.parentFolderId.toString()
        if (!bookmarkOrder[id]) {
          bookmarkOrder[id] = []
        }

        bookmarkOrder[id].push({
          key: key,
          order: oldBookmark.order,
          type: siteTags.BOOKMARK
        })
      }
    }

    // Add cache to the state
    if (!data.cache) {
      data.cache = {}
    }

    data.cache.bookmarkOrder = sortBookmarkOrder(bookmarkOrder)

    // history
    data.historySites = {}

    for (let key of Object.keys(data.sites)) {
      const site = data.sites[key]
      const newKey = historyUtil.getKey(makeImmutable(site))
      if (site.lastAccessedTime || !site.tags || site.tags.length === 0) {
        data.historySites[newKey] = site
      }
    }

    delete data.sites
  }

  if (data.lastAppVersion || data.quarantineNeeded) {
    // with version 0.22.13, any file downloaded (including the update itself) would get
    // quarantined on macOS (per work done with https://github.com/brave/muon/pull/484)
    // this functionality was then reverted with https://github.com/brave/muon/pull/570
    //
    // To fix the executable, we need to manually un-quarantine the Brave executable so that it works as expected
    if (process.platform === 'darwin' && (compareVersions(data.lastAppVersion, '0.22.13') === 0 || data.quarantineNeeded)) {
      const unQuarantine = (appPath) => {
        try {
          execSync(`xattr -d com.apple.quarantine "${appPath}" || true`)
          console.log(`Quarantine attribute has been removed from ${appPath}`)
        } catch (e) {
          console.error(`Failed to remove quarantine attribute from ${appPath}: `, e)
        }
      }

      console.log('Update was downloaded from 0.22.13' + data.quarantineNeeded ? ' (first launch after auto-update)' : '')

      // Un-quarantine default path
      const defaultAppPath = '/Applications/Brave.app'
      unQuarantine(defaultAppPath)

      // Un-quarantine custom path
      const appPath = app.getPath('exe')
      const appIndex = appPath.indexOf('.app') + '.app'.length
      if (appPath && appIndex > 4) {
        // Remove the `Contents`/`MacOS`/`Brave` parts from path
        const runningAppPath = appPath.substring(0, appIndex)
        if (runningAppPath.startsWith('/private/var/folders')) {
          // This is true when Squirrel re-launches Brave after an auto-update
          // File system is read-only; the xattr command would fail
          data.quarantineNeeded = true
        } else if (runningAppPath !== defaultAppPath) {
          // Path is the installed location
          unQuarantine(runningAppPath)
          data.quarantineNeeded = false
        }
      }
    }

    let runHSTSCleanup = false
    try { runHSTSCleanup = compareVersions(data.lastAppVersion, '0.22.13') < 1 } catch (e) {}

    if (runHSTSCleanup) {
      filtering.clearHSTSData()
    }

    // Force WidevineCdm to be upgraded when last app version <= 0.18.25
    let runWidevineCleanup = false
    let formatPublishers = false

    try {
      runWidevineCleanup = compareVersions(data.lastAppVersion, '0.18.25') < 1
      formatPublishers = compareVersions(data.lastAppVersion, '0.22.3') < 1
    } catch (e) {}

    if (runWidevineCleanup) {
      const fs = require('fs-extra')
      const wvExtPath = path.join(app.getPath('userData'), 'Extensions', 'WidevineCdm')
      fs.remove(wvExtPath, (err) => {
        if (err) {
          console.error(`Could not remove ${wvExtPath}`)
        }
      })
    }

    if (formatPublishers) {
      const publishers = data.ledger.synopsis.publishers

      if (publishers && Object.keys(publishers).length > 0) {
        Object.entries(publishers).forEach((item) => {
          const publisherKey = item[0]
          const publisher = item[1]
          const siteKey = `https?://${publisherKey}`
          if (data.siteSettings[siteKey] == null || publisher.faviconName == null) {
            return
          }

          data.siteSettings[siteKey].siteName = publisher.faviconName
        })
      }
    }

    // Bookmark cache was generated wrongly on and before 0.20.25 from 0.19.x upgrades
    let runCacheClean = false
    try { runCacheClean = compareVersions(data.lastAppVersion, '0.20.25') < 1 } catch (e) {}
    if (runCacheClean) {
      if (data.cache) {
        delete data.cache.bookmarkLocation
      }
    }

    // pinned top sites were stored in the wrong position in 0.19.x
    // and on some updates ranging from 0.20.x/0.21.x
    // allowing duplicated items. See #12941
    let pinnedTopSitesCleanup = false
    try {
      pinnedTopSitesCleanup = compareVersions(data.lastAppVersion, '0.22.00') < 1
    } catch (e) {}

    if (pinnedTopSitesCleanup) {
      if (data.about.newtab.pinnedTopSites) {
        // Empty array is currently set to include default pinned sites
        // which we avoid given the user already have a profile
        data.about.newtab.pinnedTopSites = [null]
      }
    }
  }

  // TODO: consider moving all of the above logic into here
  // see https://github.com/brave/browser-laptop/issues/10488
  const runMigrations = require('./migrations/pre')
  runMigrations(data)

  return data
}

// 0.19.x -> 0.20.x fingerprinting protection migration
const fingerprintingProtectionMigration = (immutableData) => {
  if (immutableData.get('fingerprintingProtectionAll')) {
    return immutableData
  }
  try {
    const siteSettings = immutableData.get('siteSettings', Immutable.Map())
      .map((setting) => {
        const fpSetting = setting.get('fingerprintingProtection')
        if (fpSetting === true) {
          return setting.set('fingerprintingProtection', 'blockAllFingerprinting')
        } else if (fpSetting === false) {
          return setting.set('fingerprintingProtection', 'allowAllFingerprinting')
        }
        return setting
      })
    immutableData = immutableData.set('siteSettings', siteSettings)
    const globalFpSetting = !!immutableData.getIn(['settings', 'privacy.block-canvas-fingerprinting'])
    immutableData = immutableData.setIn(['fingerprintingProtectionAll', 'enabled'],
      globalFpSetting).deleteIn(['settings', 'privacy.block-canvas-fingerprinting'])
  } catch (e) {
    console.error('fingerprinting protection migration failed', e)
  }
  return immutableData
}

module.exports.runPostMigrations = (immutableData) => {
  immutableData = fingerprintingProtectionMigration(immutableData)
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
        console.error('could not parse data: ', data, e)
      }
      data = {}
    }

    data = merge(module.exports.defaultAppState(), data)
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

    locale.init(immutableData.getIn(['settings', settings.LANGUAGE])).then((locale) => {
      immutableData = setVersionInformation(immutableData)
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
      console.error('An error occurred. For support purposes, file "' + src + '" has been copied to "' + dest + '".')
    } catch (e) {
      console.error('backupSession: error making copy of session file: ', e)
    }
  }
}

/**
 * Obtains the default application level state
 */
module.exports.defaultAppState = () => {
  const now = new Date().getTime()
  return {
    firstRunTimestamp: now,
    sync: {
      devices: {},
      lastFetchTimestamp: 0,
      objectsById: {},
      pendingRecords: {},
      lastConfirmedRecordTimestamp: 0
    },
    cache: {
      bookmarkLocation: undefined,
      bookmarkOrder: {},
      ledgerVideos: {}
    },
    pinnedSites: {},
    bookmarks: {},
    bookmarkFolders: {},
    historySites: {},
    tabs: [],
    windows: [],
    extensions: {},
    visits: [],
    settings: {},
    siteSettings: {},
    passwords: [],
    notifications: [],
    temporarySiteSettings: {},
    tor: {},
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
      },
      preferences: {},
      welcome: {
        showOnLoad: !['test', 'development'].includes(process.env.NODE_ENV) || process.env.BRAVE_SHOW_FIRST_RUN_WELCOME
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
    searchDetail: null,
    pageData: {
      info: {},
      last: {
        info: '',
        tabId: -1
      }
    },
    ledger: {
      about: {
        synopsis: [],
        synopsisOptions: {}
      },
      info: {},
      locations: {},
      synopsis: {
        options: {},
        publishers: {}
      },
      promotion: {}
    },
    windowReady: false
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
