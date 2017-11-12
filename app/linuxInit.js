/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const app = electron.app
const Channel = require('./channel')

if (process.platform === 'linux') {
  const channel = Channel.channel()

  const userDataDirSwitch = '--user-data-dir-name=brave-' + channel
  if (channel !== 'dev' && !process.argv.includes(userDataDirSwitch) &&
      !process.argv.includes('--relaunch') &&
      !process.argv.includes('--user-data-dir-name=brave-development')) {
    delete process.env.CHROME_USER_DATA_DIR
    app.relaunch({args: process.argv.slice(1).concat([userDataDirSwitch, '--relaunch'])})
    app.exit()
  }
}
