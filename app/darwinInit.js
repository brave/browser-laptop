/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

if (process.platform === 'darwin') {
  const electron = require('electron')
  const path = require('path')
  const childProcess = require('child_process')
  const execSync = childProcess.execSync
  const app = electron.app
  const fs = require('fs')
  const os = require('os')
  const appName = 'Brave Browser.app'
  const homedir = os.homedir()

  const getBraveBinPath = () => {
    const appPath = app.getPath('exe')
    const appIndex = appPath.indexOf('.app') + '.app'.length
    if (appPath && appIndex > 4) {
      // Remove the `Contents`/`MacOS`/`Brave` parts from path
      const runningAppPath = appPath.substring(0, appIndex)
      return runningAppPath
    }
    return false
  }

  const braveCoreUpgradeFile = path.join(app.getPath('userData'), 'brave-core-upgrade')

  const shouldAttemptInstall = () => {
    return !fs.existsSync(braveCoreUpgradeFile)
  }

  const getBraveCoreInstallerPath = () => {
    const appDir = getBraveBinPath()
    if (!appDir) {
      return false
    }
    return path.join(getBraveBinPath(), 'Contents', 'Resources', 'Brave-Browser.pkg')
  }

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

  const isDefaultBrowser = () => {
    try {
      const defaultProtocols = ['http', 'https']
      return defaultProtocols.every(p => app.isDefaultProtocolClient(p))
    } catch (e) {
      return false
    }
  }

  const installBraveCore = () => {
    // get path to the bundled brave-core binary
    const installerPath = getBraveCoreInstallerPath()
    if (!installerPath) {
      console.log('brave-core installer not found')
      return false
    }

    // brave-core is not installed; go ahead with silent install
    const tempDir = path.join(os.tmpdir(), 'brave-upgrade')
    try {
      console.log(`Extracting brave-core binaries from "${installerPath}" into temp directory "${tempDir}"`)
      execSync(`pkgutil --expand-full "${installerPath}" "${tempDir}"`)

      let installedPath = '/Applications'
      try {
        console.log(`Attempting to move extracted brave-core binaries into "${installedPath}/."`)
        execSync(`mv "${tempDir}/Payload/${appName}/" "${installedPath}/."`)
      } catch (globalPathException) {
        installedPath = `${homedir}/Applications`
        console.log(`Attempting to move extracted brave-core binaries into "${installedPath}/."`)
        execSync(`mv "${tempDir}/Payload/${appName}/" "${installedPath}/."`)
      }

      // match expected permissions
      // logic borrowed from ./build/pkg-scripts/postinstall
      [
        `chmod -R 775 "${installedPath}/${appName}"`,
        `chown -R $USER "${installedPath}/${appName}"`,
        `chgrp -R admin "${installedPath}/${appName}"`
      ].forEach((cmd) => {
        try {
          execSync(cmd)
        } catch (e) {
          console.log(`Failed adjusting permissions with "${cmd}"\nerror: "${e.toString()}"`)
        }
      })

      // store details to disk; no further install attempts will be made
      try {
        fs.writeFileSync(braveCoreUpgradeFile, `installed: ${new Date().getTime()}`)
      } catch (e) {
      }

      // launch into freshly installed brave-core and append argument expected in:
      // https://github.com/brave/brave-browser/issues/1545
      let openCmd = `open -a "${installedPath}/${appName}/" --args --upgrade-from-muon`
      if (isDefaultBrowser()) {
        // if user has the Muon version of Brave as their default browser, let's
        // ask the user to make Brave Core their new default. Passing this extra
        // argument will prompt the user to ensure they agree with the choice
        openCmd += ' --make-default-browser'
      }
      console.log('Launching brave-core')
      execSync(openCmd)
    } catch (e) {
      return false
    } finally {
      console.log(`Removing temp directory "${tempDir}"`)
      try {
        execSync(`rm -rf ${tempDir}`)
      } catch (e) {}
    }

    return true
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

    // If brave-core is NOT installed, attempt to install it
    if (shouldAttemptInstall()) {
      if (installBraveCore()) {
        app.exit()
      }
    }

    return {braveCoreInstalled: false}
  }
}
