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

const fs = require('fs')
const path = require('path')
const electron = require('electron')
const app = electron.app
const UpdateStatus = require('../js/constants/updateStatus')
const settings = require('../js/constants/settings')
const downloadStates = require('../js/constants/downloadStates')
const sessionStorageVersion = 1
let suffix = ''
if (process.env.NODE_ENV === 'development') {
  suffix = '-dev'
}
const sessionStorageName = `session-store-${sessionStorageVersion}${suffix}`
const storagePath = process.env.NODE_ENV !== 'test'
  ? path.join(app.getPath('userData'), sessionStorageName)
  : path.join(process.env.HOME, '.brave-test-session-store-1')
const getSetting = require('../js/settings').getSetting
const promisify = require('../js/lib/promisify')

/**
 * Saves the specified immutable browser state to storage.
 *
 * @param {object} payload - Application state as per
 *   https://github.com/brave/browser/wiki/Application-State
 *   (not immutable data)
 * @return a promise which resolves when the state is saved
 */
module.exports.saveAppState = (payload) => {
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
    } else {
      delete payload.perWindowState
    }

    try {
      module.exports.cleanAppData(payload)
      payload.cleanedOnShutdown = true
    } catch (e) {
      payload.cleanedOnShutdown = false
    }

    const epochTimestamp = (new Date()).getTime().toString()
    const tmpStoragePath = process.env.NODE_ENV !== 'test'
      ? path.join(app.getPath('userData'), 'session-store-tmp-' + epochTimestamp)
      : path.join(process.env.HOME, '.brave-test-session-store-tmp-' + epochTimestamp)

    promisify(fs.writeFile, tmpStoragePath, JSON.stringify(payload))
      .then(() => promisify(fs.rename, tmpStoragePath, storagePath))
      .then(resolve)
      .catch(reject)
  })
}

/**
 * Cleans session data from unwanted values.
 */
module.exports.cleanSessionData = (sessionData) => {
  if (!sessionData) {
    sessionData = {}
  }
  // Hide the context menu when we restore.
  delete sessionData.contextMenuDetail
  // Don't save preview frame since they are only related to hovering on a tab
  delete sessionData.previewFrameKey
  // Don't restore add/edit dialog
  delete sessionData.bookmarkDetail
  // Don't restore bravery panel
  delete sessionData.braveryPanelDetail
  // Don't restore drag data
  if (sessionData.ui) {
    delete sessionData.ui.dragging
  }
  sessionData.frames = sessionData.frames || []
  let newKey = 0
  const cleanFrame = (frame) => {
    newKey++
    // Reset the ids back to sequential numbers
    if (frame.key === sessionData.activeFrameKey) {
      sessionData.activeFrameKey = newKey
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

  // Clean closed frame data before frames because the keys are re-ordered
  // and the new next key is calculated in windowStore.js based on
  // the max frame key ID.
  if (sessionData.closedFrames) {
    sessionData.closedFrames.forEach(cleanFrame)
  }
  if (sessionData.frames) {
    // Don't restore pinned locations because they will be auto created by the app state change event
    sessionData.frames = sessionData.frames
      .filter((frame) => !frame.pinnedLocation)
    sessionData.frames.forEach(cleanFrame)
  }
}

/**
 * Cleans app data before it's written to disk.
 * @param {Object} data - top-level app data
 */
module.exports.cleanAppData = (data) => {
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
  // We used to store a huge list of IDs but we didn't use them.
  // Get rid of them here.
  delete data.windows
  if (data.perWindowState) {
    data.perWindowState.forEach(module.exports.cleanSessionData)
  }
  // Delete expired Flash approvals
  let now = Date.now()
  for (var host in data.siteSettings) {
    let expireTime = data.siteSettings[host].flash
    if (typeof expireTime === 'number' && expireTime < now) {
      delete data.siteSettings[host].flash
    }
  }
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
      data = fs.readFileSync(storagePath)
    } catch (e) {
    }

    if (!data) {
      reject()
      return
    }

    try {
      data = Object.assign(module.exports.defaultAppState(), JSON.parse(data))
    } catch (e) {
      // TODO: Session state is corrupted, maybe we should backup this
      // corrupted value for people to report into support.
      console.log('could not parse data: ', data)
      reject(e)
      return
    }
    // Clean app data here if it wasn't cleared on shutdown
    if (data.cleanedOnShutdown !== true) {
      module.exports.cleanAppData(data)
    }
    data.cleanedOnShutdown = false
    // Always recalculate the update status
    if (data.updates) {
      const updateStatus = data.updates.status
      delete data.updates.status
      // The process always restarts after an update so if the state
      // indicates that a restart isn't wanted, close right away.
      if (updateStatus === UpdateStatus.UPDATE_APPLYING_NO_RESTART) {
        module.exports.saveAppState(data).then(() => {
          // Exit immediately without doing the session store saving stuff
          // since we want the same state saved except for the update status
          app.exit(0)
        })
        return
      }
    }
    // Delete downloaded items older than a week
    if (data.downloads) {
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
    resolve(data)
  })
}

/**
 * Obtains the default application level state
 */
module.exports.defaultAppState = () => {
  return {
    sites: [],
    visits: [],
    settings: {},
    siteSettings: {},
    passwords: [],
    notifications: [],
    temporarySiteSettings: {},
    dictionary: {
      addedWords: [],
      ignoredWords: []
    }
  }
}
