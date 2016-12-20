/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// The package npm task builds this module
let config = {}
try {
  config = require('../js/constants/buildConfig')
} catch (e) {
  // noop here - the buildConfig may not exist in dev mode
}

// The current channel is retrieved first from the environment,
// then the buildConfig constants file and finally defaults to dev
var channel = process.env.CHANNEL || config.channel || 'dev'
let channels = new Set(['dev', 'beta', 'stable'])

if (!channels.has(channel)) {
  throw new Error(`Invalid channel ${channel}`)
}

exports.channel = () => {
  return channel
}

exports.browserLaptopRev = () => process.env.NODE_ENV === 'development'
  ? require('git-rev-sync').long()
  : config.BROWSER_LAPTOP_REV
