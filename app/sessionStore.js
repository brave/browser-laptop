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
const app = require('app')
const sessionStorageVersion = 1
const sessionStorageName = `session-store-${sessionStorageVersion}`
const storagePath = path.join(app.getPath('userData'), sessionStorageName)

/**
 * Saves the specified immutable browser state to storage.
 *
 * @param {object} payload - Applicaiton state as per
 *   https://github.com/brave/browser/wiki/Application-State
 *   (not immutable data)
 * @return a promise which resolves when the state is saved
 */
module.exports.saveAppState = (payload) => {
  return new Promise((resolve, reject) => {
    // Don't persist private frames
    if (payload.perWindowState) {
      payload.perWindowState.forEach(wndPayload =>
        wndPayload.frames = wndPayload.frames.filter(frame => !frame.isPrivate))
    }

    // Always recalculate the update status
    if (payload.updates) {
      delete payload.updates.status
    }

    // payload.frames = payload.frames.filter(frame => !frame.isPrivate)
    fs.writeFile(storagePath, JSON.stringify(payload), (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
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
  sessionData.contextMenuDetail = null

  // Don't save preview frame since they are only related to hovering on a tab
  delete sessionData.previewFrameKey
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
    frame.src = frame.location

    // If a blob is present for the thumbnail, create the object URL
    if (frame.thumbnailBlob) {
      try {
        frame.thumbnailUrl = window.URL.createObjectURL(frame.thumbnailBlob)
      } catch (e) {
        delete frame.thumbnailUrl
      }
    }

    // Delete lists of blocked sites
    delete frame.replacedAds
    delete frame.blockedAds
    delete frame.blockedByTracking

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
    delete frame.findDetail
    delete frame.findbarShown
    // Don't store child tab open ordering since keys
    // currently get re-generated when session store is
    // restored.  We will be able to keep this once we
    // don't regenerate new frame keys when opening storage.
    delete frame.parentFrameKey
  }

  // Clean closed frame data before frames because the keys are re-ordered
  // and the new next key is calculated in windowStore.js based on
  // the max frame key ID.
  if (sessionData.closedFrames) {
    sessionData.closedFrames.forEach(cleanFrame)
  }
  if (sessionData.frames) {
    sessionData.frames.forEach(cleanFrame)
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
    fs.readFile(storagePath, (err, data) => {
      if (err || !data) {
        reject(err)
        return
      }

      try {
        data = JSON.parse(data)
      } catch (e) {
        // TODO: Session state is corrupted, maybe we should backup this
        // corrupted value for people to report into support.
        console.log('could not parse data: ', data)
        reject(e)
        return
      }
      if (data.perWindowState) {
        data.perWindowState.forEach(module.exports.cleanSessionData)
      }
      resolve(data)
    })
  })
}

/**
 * Obtains the default application level state
 */
module.exports.defaultAppState = () => {
  return {
    windows: [],
    sites: [],
    visits: []
  }
}
