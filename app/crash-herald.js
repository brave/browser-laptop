/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Channel = require('./channel')
const {app} = require('electron')

const version = app.getVersion()
const channel = Channel.channel()

const initCrashKeys = () => {
  // set muon-app-version switch to pass version to renderer processes
  app.commandLine.appendSwitch('muon-app-version', version)
  app.commandLine.appendSwitch('muon-app-channel', channel)

  muon.crashReporter.setVersionCrashValue(version)
  muon.crashReporter.setChannelCrashValue(channel)
}

exports.init = (enabled) => {
  if (enabled) {
    initCrashKeys()
    muon.crashReporter.setEnabled(enabled)
    console.log('Crash reporting enabled')
  } else {
    console.log('Crash reporting disabled')
  }
}
