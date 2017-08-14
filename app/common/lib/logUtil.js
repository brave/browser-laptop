/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const fs = require('fs')
const os = require('os')

module.exports.HrtimeLogger = class {
  /**
   * @param path {string} Path to log file.
   * @param threshold {number=} Nanoseconds; only log events which took longer than this.
   */
  constructor (path, threshold) {
    this.path = path
    this.threshold = threshold
  }

  /**
   * @param value {number} Nanoseconds; time of an event
   */
  shouldLogValue (value) {
    return (typeof this.threshold === 'number') && (value > this.threshold)
  }

  /**
   * @param hrtimeResult {Array.<number>} Result of the second call to process.hrtime
   * @param label {string} Label
   */
  log (hrtimeResult, label) {
    const time = process.hrtime(hrtimeResult)
    const msTime = (1e3 * time[0]) + (time[1] / 1e6)
    if (this.shouldLogValue(msTime) !== true) { return }
    const data = `${Date.now()},${label},${msTime}`
    fs.appendFile(this.path, data + os.EOL, (err) => {
      if (err) { console.log(err) }
    })
  }
}
