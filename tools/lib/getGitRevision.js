/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
const { exec } = require('child_process')

module.exports = function getGitRevision () {
  return new Promise((resolve, reject) => {
    exec('git rev-parse --verify HEAD', (err, stdout, stderr) => {
      if (err) return reject(err)
      if (stderr) return reject(stderr)
      resolve(stdout)
    })
  })
}
