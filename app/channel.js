/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// The package npm task builds this module
const config = require('../js/constants/buildConfig')

// The current channel is retrieved first from the buildConfig constants file,
// then the environments and finally defaults to dev
var channel = config.channel || process.env.CHANNEL || 'dev'
let channels = new Set(['dev', 'beta', 'stable', 'developer', 'nightly'])

if (!channels.has(channel)) {
  throw new Error(`Invalid channel ${channel}`)
}

exports.channel = () => {
  return channel
}

exports.formattedChannel = () => {
  const locale = require('./locale')

  const channelMapping = {
    'dev': locale.translation('channelDev'),
    'beta': locale.translation('channelBeta')
  }
  return Object.keys(channelMapping).includes(channel) ? channelMapping[channel] : channel
}

exports.browserLaptopRev = () => process.env.NODE_ENV === 'development'
  ? require('git-rev-sync').long()
  : config.BROWSER_LAPTOP_REV
