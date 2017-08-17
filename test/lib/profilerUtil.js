/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Brave = require('./brave')
const CDP = require('chrome-remote-interface')
const fs = require('fs')

const LOG_FOLDER = './cpu-profiles'

// Private
// ===

/**
 * Derive main process remote debug port based on webdriver args.
 * @param {Spectron.Application} app e.g. Brave.app
 * @returns {number}
 */
const getDebugPort = function (app) {
  if (!app.args) { return }
  for (let arg of app.args) {
    if (arg.indexOf('--debug') === -1 && arg.indexOf('--inspect') === -1) {
      continue
    }
    const regex = /([0-9]+)$/
    const result = arg.match(regex)
    if (!result[1]) { continue }
    return parseInt(result[1])
  }
}

// Public
// ===

/**
 * Connect to a remote instance using Chrome Debugging Protocol.
 * See https://github.com/cyrus-and/chrome-remote-interface#cdpoptions-callback
 */
const initCDP = function * () {
  const port = getDebugPort(Brave.app)
  if (!port) {
    throw new Error("Could not determine RDP port from webdriver app args. Did you start with Brave.startApp(['--debug={inspectPort}'] ?")
  }
  const cdp = yield CDP({port})
  Brave.cdp = cdp
}

const startProfiler = function * () {
  yield initCDP()
  yield Brave.cdp.Profiler.enable()
  yield Brave.cdp.Profiler.setSamplingInterval({interval: 100})
  yield Brave.cdp.Profiler.start()
}

/**
 * @param logTag {string=} Optional file prefix
 * @returns filename to which CPU profile was written
 */
const stopProfiler = function * (logTag = '') {
  const cdpProfilerResult = yield Brave.cdp.Profiler.stop()
  if (!fs.existsSync(LOG_FOLDER)) {
    console.log(`Creating directory ${LOG_FOLDER}`)
    fs.mkdirSync(LOG_FOLDER)
  }
  const fileContent = JSON.stringify(cdpProfilerResult.profile, null, 2)
  const filename = `${logTag}-${new Date().toISOString()}.cpuprofile`
  const path = `${LOG_FOLDER}/${filename}`
  fs.writeFile(path, fileContent)
  console.log(`Wrote CPU profile data to: ${path}`)
  return filename
}

/**
 * Profile a function.
 * @param {function} fn
 */
const profile = function * (fn, logTag) {
  yield startProfiler()
  yield fn()
  yield stopProfiler(logTag)
}

const uploadTravisArtifacts = function * () {
  if (!process.env.TRAVIS) { return }
  console.log('Uploading Travis artifacts...')
  const execute = require('../../tools/lib/execute')
  const command = `artifacts upload ${LOG_FOLDER} --target-paths "$TRAVIS_REPO_SLUG/$TRAVIS_BRANCH/$TRAVIS_BUILD_NUMBER--$TRAVIS_COMMIT"`
  yield new Promise((resolve, reject) => {
    execute(command, process.env, (err) => {
      if (err) {
        console.error('Failed to upload artifacts', err)
        process.exit(1)
        return reject(err)
      }
      resolve()
    })
  })
}

module.exports = {
  initCDP,
  startProfiler,
  stopProfiler,
  profile,
  uploadTravisArtifacts
}
