/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConfig = require('../js/constants/appConfig')
const config = require('../js/constants/config')
const buildConfig = require('../js/constants/buildConfig')
const crashReporter = require('electron').crashReporter

exports.init = () => {
  const options = {
    productName: 'Brave Developers',
    companyName: 'Brave.com',
    submitURL: appConfig.crashes.crashSubmitUrl,
    autoSubmit: true,
    extra: {
      node_env: config.env,
      rev: buildConfig.BROWSER_LAPTOP_REV || 'unknown'
    }
  }
  crashReporter.start(options)
}
