/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const path = require('path')

// buildConfig.js stores values created at build time but available
// at program runtime. A buildConfig.js file is created in the
// js/constants directory that may be directly required.
exports.writeBuildConfig = (config, filename) => {
  if (!filename) {
    filename = 'buildConfig.js'
  }
  const buf = 'module.exports = ' + JSON.stringify(config, null, 2)
  fs.writeFileSync(path.join(__dirname, '..', '..', 'js', 'constants', filename), buf)
  return config
}

exports.clearBuildConfig = (filename) => {
  return exports.writeBuildConfig({}, filename)
}
