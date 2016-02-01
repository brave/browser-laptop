/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'strict mode'

const assert = require('assert')
const request = require('request')
const autoUpdater = require('auto-updater')
const AppConfig = require('../js/constants/appConfig')
const messages = require('../js/constants/messages')
const UpdateStatus = require('../js/constants/updateStatus')
const querystring = require('querystring')
const AppStore = require('../js/stores/appStore')
const AppActions = require('../js/actions/appActions')
const Immutable = require('immutable')
const dates = require('./dates')

const fs = require('fs')
const path = require('path')
const app = require('app')
const updateLogPath = path.join(app.getPath('userData'), 'updateLog.log')

// in built mode console.log output is not emitted to the terminal
// in prod mode we pipe to a file
var debug = function (contents) {
  fs.appendFile(updateLogPath, new Date().toISOString() + ' - ' + contents + '\n')
}

// this maps the result of a call to process.platform to an update API identifier
var platforms = {
  'darwin': 'osx',
  'win32': 'winx64'
}

// We are storing this as a package variable because a number of functions need access
// It is set in the init function
var platformBaseUrl = null
var version = null

// build the complete update url from the base, platform and version
exports.updateUrl = function (updates, platform) {
  platformBaseUrl = `${updates.baseUrl}/${platforms[platform]}/${version}`
  debug(`platformBaseUrl = ${platformBaseUrl}`)
  if (platform === 'darwin') {
    return platformBaseUrl
  } else {
    return updates.winBaseUrl
  }
}

// Setup schedule for periodic and startup update checks
var scheduleUpdates = () => {
  // Periodic check
  if (AppConfig.updates.appUpdateCheckFrequency) {
    setInterval(() => {
      exports.checkForUpdate()
    }, AppConfig.updates.appUpdateCheckFrequency)
  }

  // Startup check
  if (AppConfig.updates.runtimeUpdateCheckDelay) {
    setTimeout(() => {
      exports.checkForUpdate()
    }, AppConfig.updates.runtimeUpdateCheckDelay)
  }
}

// set the feed url for the auto-update system
exports.init = (platform, ver) => {
  // When starting up we should not expect an update to be available
  AppActions.setUpdateStatus(UpdateStatus.UPDATE_NONE)

  // Browser version X.X.X
  version = ver

  var baseUrl = exports.updateUrl(AppConfig.updates, platform)
  debug('updateUrl = ' + baseUrl)

  scheduleUpdates()

  // This will fail if we are in dev
  try {
    autoUpdater.setFeedURL(baseUrl)
  } catch (err) {
    console.log(err)
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
var requestVersionInfo = (done) => {
  if (!platformBaseUrl) throw new Error('platformBaseUrl not set')

  // Get the daily, week of year and month update checks
  var lastCheckYMD = AppStore.getState().toJS().updates['lastCheckYMD'] || null
  debug(`lastCheckYMD = ${lastCheckYMD}`)

  var lastCheckWOY = AppStore.getState().toJS().updates['lastCheckWOY'] || null
  debug(`lastCheckWOY = ${lastCheckWOY}`)

  var lastCheckMonth = AppStore.getState().toJS().updates['lastCheckMonth'] || null
  debug(`lastCheckMonth = ${lastCheckMonth}`)

  // Has the browser ever asked for an update
  var firstCheckMade = AppStore.getState().toJS().updates['firstCheckMade'] || false
  debug(`firstCheckMade = ${firstCheckMade}`)

  // Build query string based on the last date an update request was made
  var query = paramsFromLastCheckDelta(
    lastCheckYMD,
    lastCheckWOY,
    lastCheckMonth,
    firstCheckMade
  )
  var queryString = `${platformBaseUrl}?${querystring.stringify(query)}`
  debug(queryString)

  request(queryString, (err, response, body) => {
    AppActions.setUpdateLastCheck()
    if (!err) {
      if (body) {
        body = JSON.parse(body)
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
  debug('Metadata: ' + JSON.stringify(metadata))
  AppActions.setUpdateStatus(undefined, undefined, Immutable.fromJS(metadata))
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
    AppActions.setUpdateStatus(undefined, verbose)
    return
  }
  // Force falsy or truthy here so session store will write out a value
  // and it won't auto make updater UI appear periodically.
  AppActions.setUpdateStatus(UpdateStatus.UPDATE_CHECKING, !!verbose)
  debug('checkForUpdates')
  try {
    requestVersionInfo(downloadHandler)
  } catch (err) {
    debug(err)
  }
}

// The UI indicates that we should update the software
exports.updateNowRequested = () => {
  debug('update requested in updater')
  // App shutdown process will save state and then call autoUpdater.quitAndInstall
  AppActions.setUpdateStatus(UpdateStatus.UPDATE_APPLYING_RESTART)
}

exports.quitAndInstall = () => {
  autoUpdater.quitAndInstall()
}

// The download is complete, we send a signal and await UI
autoUpdater.on('update-downloaded', (evt, releaseNotes, releaseDate, updateURL) => {
  debug('update downloaded')
  if (releaseNotes) {
    debug('Release notes :' + releaseNotes)
  }
  if (releaseDate) {
    debug('Release date: ' + releaseDate)
  }
  if (updateURL) {
    debug('Update URL: ' + updateURL)
  }
  AppActions.setUpdateStatus(UpdateStatus.UPDATE_AVAILABLE)
})

// Download has started
autoUpdater.on(messages.UPDATE_AVAILABLE, (evt) => {
  debug('update downloading')
  AppActions.setUpdateStatus(UpdateStatus.UPDATE_DOWNLOADING)
})

// The current version of the software is up to date
autoUpdater.on(messages.UPDATE_NOT_AVAILABLE, (evt) => {
  debug('update not available')
  AppActions.setUpdateStatus(UpdateStatus.UPDATE_NOT_AVAILABLE)
})

// Handle autoUpdater errors (Network, permissions etc...)
autoUpdater.on('error', (err) => {
  AppActions.setUpdateStatus(UpdateStatus.UPDATE_ERROR)
  debug(err)
})
