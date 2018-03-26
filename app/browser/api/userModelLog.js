/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const ledgerUtil = require('../../common/lib/ledgerUtil')
const path = require('path')

let fs
let demoValue = []
let saveInterval = null
let savedValues = 0

const api = {
  appendValue: (eventName, data) => {
    demoValue.unshift({
      time: new Date().toISOString(),
      eventName,
      data: data || ''
    })

    if (!saveInterval) {
      saveInterval = setInterval(() => {
        if (demoValue.length !== savedValues) {
          if (!fs) fs = require('fs')
          const filePath = path.join(electron.app.getPath('userData'), 'userModelLogs.txt')
          fs.writeFile(filePath, JSON.stringify(demoValue), () => {})
          savedValues = demoValue.length
        }
      }, 5 * ledgerUtil.milliseconds.minute)
    }
  },

  getValue: () => {
    return demoValue
  }
}

module.exports = api
