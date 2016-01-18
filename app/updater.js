/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'strict mode'

const assert = require('assert')
const request = require('request')
const autoUpdater = require('auto-updater')
const config = require('./appConfig')
const messages = require('../js/constants/messages')
const UpdateStatus = require('../js/constants/updateStatus')
const querystring = require('querystring')
const AppStore = require('../js/stores/appStore')
const AppActions = require('../js/actions/appActions')
const Immutable = require('immutable')

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
  if (config.updates.appUpdateCheckFrequency) {
    setInterval(() => {
      exports.checkForUpdate()
    }, config.updates.appUpdateCheckFrequency)
  }

  // Startup check
  if (config.updates.runtimeUpdateCheckDelay) {
    setTimeout(() => {
      exports.checkForUpdate()
    }, config.updates.runtimeUpdateCheckDelay)
  }
}

// set the feed url for the auto-update system
exports.init = (platform, ver) => {
  // When starting up we should not expect an update to be available
  AppActions.setUpdateStatus(UpdateStatus.UPDATE_NONE)

  // Browser version X.X.X
  version = ver

  var baseUrl = exports.updateUrl(config.updates, platform)
  debug('updateUrl = ' + baseUrl)

  scheduleUpdates()

  // This will fail if we are in dev
  try {
    autoUpdater.setFeedURL(baseUrl)
  } catch (err) {
    console.log(err)
  }
}

const secondsPerDay = 24 * 60 * 60
const secondsPerWeek = secondsPerDay * 7
const secondsPerMonth = secondsPerDay * 30

// Build a set of three params providing flags determining when the last update occurred
// This is a privacy preserving policy. Instead of passing personally identifying
// information, the browser will pass the three boolean values indicating when the last
// update check occurred.
var paramsFromLastCheckDelta = (seconds) => {
  // Default params
  var params = {
    daily: false,
    weekly: false,
    monthly: false
  }

  // First ever check
  if (seconds === 0) {
    params.daily = true
    return params
  }

  // More than one today
  if (seconds < secondsPerDay) {
    return params
  }

  // If we have not checked today, but we have since last week (first check as well)
  if (seconds === 0 || (seconds > secondsPerDay && seconds < secondsPerWeek)) {
    params.daily = true
    return params
  }

  // If we have not checked this week, but have this month
  if (seconds >= secondsPerWeek && seconds < secondsPerMonth) {
    params.weekly = true
    return params
  }

  params.monthly = true

  return params
}

// Make a request to the update server to retrieve meta data
var requestVersionInfo = (done) => {
  if (!platformBaseUrl) throw new Error('platformBaseUrl not set')

  // Get the timestamp of the last update request
  var lastCheckTimestamp = AppStore.getState().toJS().updates['lastCheckTimestamp'] || 0
  debug(`lastCheckTimestamp = ${lastCheckTimestamp}`)

  // Calculate the number of seconds since the last update
  var secondsSinceLastCheck = 0
  if (lastCheckTimestamp) {
    secondsSinceLastCheck = Math.round(((new Date()).getTime() - lastCheckTimestamp) / 1000)
  }
  debug(`secondsSinceLastCheck = ${secondsSinceLastCheck}`)

  // Build query string based on the number of seconds since last check
  var query = paramsFromLastCheckDelta(secondsSinceLastCheck)
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
      debug(err.toString())
    }
  })
}

var downloadHandler = (err, metadata) => {
  assert.equal(err, null)
  AppActions.setUpdateStatus(undefined, undefined, Immutable.fromJS(metadata))
  if (process.platform === 'win32') {
    // check versions to see if an update is required
    if (metadata) {
      autoUpdater.checkForUpdates()
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
exports.update = () => {
  debug('update requested in updater')
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
