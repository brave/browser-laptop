/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

if (process.platform === 'darwin') {
  const childProcess = require('child_process')
  const execSync = childProcess.execSync
  const fs = require('fs')
  const os = require('os')
  const appName = 'Brave Browser.app'
  const homedir = os.homedir()

  const getBraveCoreInstallPath = () => {
    const braveCoreInstallLocations = [
      `${homedir}/Applications/${appName}/`,
      `/Applications/${appName}/`
    ]

    // check for existing installations
    for (var i = 0; i < braveCoreInstallLocations.length; i++) {
      if (fs.existsSync(braveCoreInstallLocations[i])) {
        console.log(`brave-core already installed at "${braveCoreInstallLocations[i]}"`)
        return braveCoreInstallLocations[i]
      }
    }

    return false
  }

  module.exports = function () {
    // If brave-core is installed, find the path and version
    const braveCoreInstallPath = getBraveCoreInstallPath()
    if (braveCoreInstallPath) {
      const getVersionCmd = `defaults read "${braveCoreInstallPath}/Contents/Info" CFBundleShortVersionString`
      let braveCoreVersion
      try {
        // format will be like `71.0.57.4`
        braveCoreVersion = execSync(getVersionCmd).toString().trim()
        // remove the Chromium version from the string
        const versionAsArray = braveCoreVersion.split('.')
        if (versionAsArray.length === 4) {
          braveCoreVersion = versionAsArray.slice(1).join('.')
        }
      } catch (e) {}

      return {braveCoreInstalled: true, braveCoreInstallPath, braveCoreVersion}
    }

    return {braveCoreInstalled: false}
  }
}
