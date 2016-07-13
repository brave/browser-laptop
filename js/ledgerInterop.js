/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ipc = global.require('electron').ipcRenderer
const messages = require('./constants/messages')

// Retrieve the history from the main process
module.exports.generalCommunications = () => {
  return ipc.sendSync(messages.LEDGER_GENERAL_COMMUNICATION)
}
