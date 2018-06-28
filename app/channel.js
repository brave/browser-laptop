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

// getTorSocksProxy()
//
//      Return the socks5:// `URL' for the Tor socks proxy we will
//      configure the tor daemon to listen on and muon to connect to,
//      depending on which channel we're using.  This is provisional
//      until we let the OS choose the port number as in
//      <https://github.com/brave/browser-laptop/issues/12936>, or
//      until we add support for local sockets for SOCKS proxies as in
//      <https://github.com/brave/muon/issues/469>.
//
exports.getTorSocksProxy = () => {
  let portno
  switch (channel) {
    case 'dev':
    default:
      portno = 9250
      break
    case 'beta':
      portno = 9260
      break
    case 'nightly':
      portno = 9270
      break
    case 'developer':
      portno = 9280
      break
    case '':
      portno = 9290
      break
  }
  return `socks5://127.0.0.1:${portno}`
}
