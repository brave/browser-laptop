/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// The package npm task builds this module
const config = require('../js/constants/buildConfig')

// The current channel is retrieved first from the buildConfig constants file,
// then the environments and finally defaults to dev
var channel = config.channel || process.env.CHANNEL || ''
let channels = new Set(['dev', 'beta', 'stable', 'developer', 'nightly', ''])

if (!channels.has(channel)) {
  throw new Error(`Invalid channel ${channel}`)
}

exports.channel = () => {
  return channel
}

exports.formattedChannel = () => {
  const locale = require('./locale')

  const channelMapping = {
    'dev': locale.translation('channelRelease'),
    'beta': locale.translation('channelBeta'),
    'developer': locale.translation('channelDeveloper'),
    'nightly': locale.translation('channelNightly')
  }
  return Object.keys(channelMapping).includes(channel) ? channelMapping[channel] : channel
}

exports.getLinuxDesktopName = () => {
  let desktopName
  switch (channel) {
    case 'dev':
      desktopName = 'brave.desktop'
      break
    case 'beta':
      desktopName = 'brave-beta.desktop'
      break
    case 'developer':
      desktopName = 'brave-developer.desktop'
      break
    case 'nightly':
      desktopName = 'brave-nightly.desktop'
      break
    default:
      desktopName = 'brave.desktop'
  }
  return desktopName
}
