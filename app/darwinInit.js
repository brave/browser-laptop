/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const path = require('path')
const childProcess = require('child_process')
const execSync = childProcess.execSync
const app = electron.app
const os = require('os')

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

const getBraveCoreInstallerPath = () => {
  const appDir = getBraveBinPath()
  if (!appDir) {
    return false
  }
  return path.join(appDir, 'resources', 'Brave-Browser.pkg')
}

function InstallBraveCore () {
  // TODO(bsclifton): uncomment
  // const fs = require('fs')
  const homedir = os.homedir()

  console.log('InstallBraveCore START')

  // expected install paths
  const braveCoreInstallLocations = [
    `${homedir}/Applications/Brave Browser.app/`,
    '/Applications/Brave Browser.app/'
  ]

  // check for existing installations
  for (var i = 0; i < braveCoreInstallLocations.length; i++) {
    // console.log(`BSC]] checking ${braveCoreInstallLocations[i]}`)
    // if (fs.existsSync(braveCoreInstallLocations[i])) {
    //   console.log(`BSC]] already installed at "${braveCoreInstallLocations[i]}"`)
    //   return false
    // }
  }

  // TODO(bsclifton): change back to const
  let installerPath = getBraveCoreInstallerPath()
  if (!installerPath) {
    return false
  }
  const tempDir = path.join(os.tmpdir(), 'brave-upgrade')

  // TODO(bsclifton): BSC- REMOVE ME - START
  let cwd = execSync('pwd').toString().trim()
  installerPath = path.join(cwd, 'res', 'Brave-Browser-0.55.20.pkg')
  // TODO(bsclifton): BSC- REMOVE ME - END

  // brave-core is not installed; go ahead with silent install
  try {
    console.log(`Extracting brave-core binaries from "${installerPath}" into temp directory "${tempDir}"`)
    execSync(`pkgutil --expand-full "${installerPath}" "${tempDir}"`)

    let installedPath = '/Applications'
    try {
      console.log(`Attempting to move extracted brave-core binaries into "${installedPath}/."`)
      execSync(`mv "${tempDir}/Payload/Brave Browser.app/" "${installedPath}/."`)
    } catch (globalPathException) {
      installedPath = `${homedir}/Applications`
      console.log(`Attempting to move extracted brave-core binaries into "${installedPath}/."`)
      execSync(`mv "${tempDir}/Payload/Brave Browser.app/" "${installedPath}/."`)
    }

    // TODO(bsclifton): set permissions
    // drwxr-xr-x@  3 clifton  admin    96B Oct 18 09:46 Brave Browser.app

    console.log('Launching brave-core')
    execSync(`open -a "${installedPath}/Brave Browser.app/"`)
  } catch (e) {
    return false
  } finally {
    console.log(`Removing temp directory "${tempDir}"`)
    try {
      execSync(`rm -rf ${tempDir}`)
    } catch (e) {}
    console.log('InstallBraveCore END')
  }

  return true
}

// TODO(bsclifton): only execute if updating?
if (InstallBraveCore()) {
  console.log('BSC]] install complete')
}
app.exit()
