/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConfig = require('../js/constants/appConfig')
const crashReporter = require('electron').crashReporter

// buildConfig.js is built at package time, we need to require it in a try/catch
// block to trap for it not existing yet.
var buildConfig
try {
  buildConfig = require('../js/constants/buildConfig')
} catch (e) {
  buildConfig = {}
}

exports.init = () => {
  const options = {
    productName: 'Brave Developers',
    companyName: 'Brave.com',
    submitURL: appConfig.crashes.crashSubmitUrl,
    autoSubmit: true,
    extra: {
      node_env: process.env.NODE_ENV,
      rev: buildConfig.BROWSER_LAPTOP_REV || 'unknown'
    }
  }
  crashReporter.start(options)
}
