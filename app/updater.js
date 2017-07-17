/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'strict mode'

const assert = require('assert')
const request = require('../js/lib/request').request
const electron = require('electron')
const autoUpdater = electron.autoUpdater
const app = electron.app
const appConfig = require('../js/constants/appConfig')
const messages = require('../js/constants/messages')
const UpdateStatus = require('../js/constants/updateStatus')
const querystring = require('querystring')
const AppStore = require('../js/stores/appStore')
const appActions = require('../js/actions/appActions')
const Immutable = require('immutable')
const dates = require('./dates')
const Channel = require('./channel')

const fs = require('fs')
const path = require('path')
const os = require('os')

// in built mode console.log output is not emitted to the terminal
// in prod mode we pipe to a file
var debug = function (contents) {
  const updateLogPath = path.join(app.getPath('userData'), 'updateLog.log')
  fs.appendFile(updateLogPath, new Date().toISOString() + ' - ' + contents + os.EOL, (err) => {
    if (err) console.log(err)
  })
}

// this maps the result of a call to process.platform to an update API identifier
var platforms = {
  'darwin': 'osx',
  'win32x64': 'winx64',
  'win32ia32': 'winia32',
  'linux': 'linux'
}

// We are storing this as a package variable because a number of functions need access
// It is set in the init function
var platformBaseUrl = null
var version = null
var updateToPreviewReleases = false

// build the complete update url from the base, platform and version
exports.updateUrl = function (updates, platform, arch) {
  // For windows we need to separate x64 and ia32 for update purposes
  if (platform === 'win32') {
    platform = platform + arch
  }
  platformBaseUrl = `${updates.baseUrl}/${Channel.channel()}/${version}/${platforms[platform]}`
  debug(`platformBaseUrl = ${platformBaseUrl}`)
  if (platform === 'darwin' || platform === 'linux') {
    return platformBaseUrl
  } else {
    if (platform.match(/^win32/)) {
      var windowsUpdateUrlWithArch = updates.winBaseUrl.replace('CHANNEL', Channel.channel()) + platforms[platform]
      return windowsUpdateUrlWithArch
    } else {
      // Unsupport platform for automatic updates
      return null
    }
  }
}

// Setup schedule for periodic and startup update checks
var scheduleUpdates = () => {
  // Periodic check
  if (appConfig.updates.appUpdateCheckFrequency) {
    setInterval(() => {
      exports.checkForUpdate()
    }, appConfig.updates.appUpdateCheckFrequency)
  }

  // Startup check
  if (appConfig.updates.runtimeUpdateCheckDelay) {
    setTimeout(() => {
      exports.checkForUpdate()
    }, appConfig.updates.runtimeUpdateCheckDelay)
  }
}

// set the feed url for the auto-update system
exports.init = (platform, arch, ver, updateToPreview) => {
  // When starting up we should not expect an update to be available
  appActions.setUpdateStatus(UpdateStatus.UPDATE_NONE)

  // Browser version X.X.X
  version = ver

  // Flag controlling whether preview releases are accepted
  updateToPreviewReleases = updateToPreview

  var baseUrl = exports.updateUrl(appConfig.updates, platform, arch)
  var query = { accept_preview: updateToPreviewReleases ? 'true' : 'false' }

  if (baseUrl) {
    debug(`updateUrl = ${baseUrl}`)
    scheduleUpdates()
    // This will fail if we are in dev
    try {
      // add the preview flag to the base feed url
      autoUpdater.setFeedURL(`${baseUrl}?${querystring.stringify(query)}`)
    } catch (err) {
      console.log(err)
    }
  } else {
    debug('No updateUrl, not scheduling updates.')
  }
}

// Build a set of three params providing flags determining when the last update occurred
// This is a privacy preserving policy. Instead of passing personally identifying
// information, the browser will pass thefour boolean values indicating when the last
// update check occurred.
var paramsFromLastCheckDelta = (lastCheckYMD, lastCheckWOY, lastCheckMonth, firstCheckMade) => {
  return {
    daily: !lastCheckYMD || (dates.todayYMD() > lastCheckYMD),
    weekly: !lastCheckWOY || (dates.todayWOY() !== lastCheckWOY),
    monthly: !lastCheckMonth || (dates.todayMonth() !== lastCheckMonth),
    first: !firstCheckMade
  }
}

// Make a request to the update server to retrieve meta data
var requestVersionInfo = (done, pingOnly) => {
  if (!platformBaseUrl) throw new Error('platformBaseUrl not set')

  // Get the daily, week of year and month update checks
  const state = AppStore.getState()
  var lastCheckYMD = state.getIn(['updates', 'lastCheckYMD']) || null
  debug(`lastCheckYMD = ${lastCheckYMD}`)
  var lastCheckWOY = state.getIn(['updates', 'lastCheckWOY']) || null
  debug(`lastCheckWOY = ${lastCheckWOY}`)
  var lastCheckMonth = state.getIn(['updates', 'lastCheckMonth']) || null
  debug(`lastCheckMonth = ${lastCheckMonth}`)

  // Has the browser ever asked for an update
  var firstCheckMade = state.getIn(['updates', 'firstCheckMade']) || false
  debug(`firstCheckMade = ${firstCheckMade}`)

  // Build query string based on the last date an update request was made
  var query = paramsFromLastCheckDelta(
    lastCheckYMD,
    lastCheckWOY,
    lastCheckMonth,
    firstCheckMade
  )
  query.accept_preview = updateToPreviewReleases ? 'true' : 'false'
  var queryString = `${platformBaseUrl}?${querystring.stringify(query)}`
  debug(queryString)

  request(queryString, (err, response, body) => {
    var statusCode = response.statusCode
    appActions.setUpdateLastCheck()
    if (pingOnly) {
      return
    }
    if (!err && statusCode === 204) {
      autoUpdater.emit(messages.UPDATE_NOT_AVAILABLE)
    } else if (!err && (statusCode === 200)) {
      if (body) {
        try {
          body = JSON.parse(body)
        } catch (error) {
          autoUpdater.emit('error', error)
        }
      }
      // This should be handled by a UI component for the update toolbar
      process.emit(messages.UPDATE_META_DATA_RETRIEVED, body)
      done(null, body)
    } else {
      // Network error or mis-configuration
      autoUpdater.emit('error', err)
    }
  })
}

var downloadHandler = (err, metadata) => {
  assert.equal(err, null)
  debug(`Metadata: ${JSON.stringify(metadata)}`)
  appActions.setUpdateStatus(undefined, undefined, Immutable.fromJS(metadata))
  if (process.platform === 'win32') {
    // check versions to see if an update is required
    if (metadata) {
      autoUpdater.checkForUpdates()
    } else {
      autoUpdater.emit(messages.UPDATE_NOT_AVAILABLE)
    }
  } else {
    autoUpdater.checkForUpdates()
  }
}

// Make network request to check for an available update
exports.checkForUpdate = (verbose) => {
  const updateStatus = AppStore.getState().getIn(['updates', 'status'])
  if (updateStatus !== UpdateStatus.UPDATE_ERROR &&
      updateStatus !== UpdateStatus.UPDATE_NOT_AVAILABLE &&
      updateStatus !== UpdateStatus.UPDATE_NONE) {
    debug('Already checking for updates...')
    requestVersionInfo(undefined, true)
    appActions.setUpdateStatus(undefined, verbose)
    return
  }
  // Force falsy or truthy here so session store will write out a value
  // and it won't auto make updater UI appear periodically.
  appActions.setUpdateStatus(UpdateStatus.UPDATE_CHECKING, !!verbose)
  debug('checkForUpdates')
  try {
    requestVersionInfo(downloadHandler, false)
  } catch (err) {
    debug(err)
  }
}

exports.quitAndInstall = () => {
  autoUpdater.quitAndInstall()
}

// The download is complete, we send a signal and await UI
autoUpdater.on('update-downloaded', (evt, releaseNotes, releaseDate, updateURL) => {
  debug('update downloaded')
  if (releaseNotes) {
    debug(`Release notes : ${releaseNotes}`)
  }
  if (releaseDate) {
    debug(`Release date: ${releaseDate}`)
  }
  if (updateURL) {
    debug(`Update URL: ${updateURL}`)
  }
  appActions.setUpdateStatus(UpdateStatus.UPDATE_AVAILABLE)
})

// Download has started
autoUpdater.on(messages.UPDATE_AVAILABLE, (evt) => {
  debug('update downloading')
  appActions.setUpdateStatus(UpdateStatus.UPDATE_DOWNLOADING)
})

// The current version of the software is up to date
autoUpdater.on(messages.UPDATE_NOT_AVAILABLE, (evt) => {
  debug('update not available')
  appActions.setUpdateStatus(UpdateStatus.UPDATE_NOT_AVAILABLE)
})

// Handle autoUpdater errors (Network, permissions etc...)
autoUpdater.on('error', (err) => {
  appActions.setUpdateStatus(UpdateStatus.UPDATE_ERROR)
  debug(err)
})
