/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const path = require('path')
const childProcess = require('child_process')
const spawn = childProcess.spawn
const spawnSync = childProcess.spawnSync
const execSync = childProcess.execSync
const app = electron.app
const Channel = require('./channel')
const cmdLine = require('./cmdLine')
const promoCodeFirstRunStorage = require('./promoCodeFirstRunStorage')

let appUserModelId = 'com.squirrel.brave.Brave'
switch (Channel.channel()) {
  case 'nightly':
    appUserModelId = 'com.squirrel.BraveNightly.BraveNightly'
    break
  case 'developer':
    appUserModelId = 'com.squirrel.BraveDeveloper.BraveDeveloper'
    break
  case 'beta':
    appUserModelId = 'com.squirrel.BraveBeta.BraveBeta'
    break
  case 'dev':
    appUserModelId = 'com.squirrel.brave.Brave'
    break
  default:
    appUserModelId = 'com.squirrel.brave.Brave'
    break
}

const getBraveBinPath = () => {
  const appPath = app.getPath('exe')
  return path.dirname(appPath)
}

const getBraveDefaultsBinPath = () => {
  const appDir = getBraveBinPath()
  return path.join(appDir, 'resources', 'braveDefaults.exe')
}

const getVisualElementsManifestPath = () => {
  const appDir = getBraveBinPath()
  return path.join(appDir, 'resources', 'Update.VisualElementsManifest.xml')
}

function CopyManifestFile () {
  const versionedRoot = getBraveBinPath()
  let updateRoot = versionedRoot.split('\\')
  updateRoot.pop()
  updateRoot = updateRoot.join('\\')
  const cmd = 'copy "' + getVisualElementsManifestPath() + '" "' + updateRoot + '"'
  execSync(cmd)
}

const getBraveCoreInstallerPath = () => {
  const os = require('os')
  const appDir = getBraveBinPath()
  return path.join(appDir, 'resources',
    os.arch() === 'x32' ? 'BraveBrowserSetup32.exe' : 'BraveBrowserSetup64.exe')
}

function GetBraveCoreInstallPath () {
  const fs = require('fs')

  // expected install paths
  const braveCoreInstallLocations = [
    '%USERPROFILE%\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application',
    '%ProgramFiles(x86)%\\BraveSoftware\\Brave-Browser\\Application',
    '%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application'
  ]

  // check for existing installations
  for (let i = 0; i < braveCoreInstallLocations.length; i++) {
    const path = braveCoreInstallLocations[i]
    const resolvedPath = path.replace(/%([^%]+)%/g, function (_, variableToResolve) {
      return process.env[variableToResolve]
    })
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath
    }
  }

  return false
}

function InstallBraveCore () {
  if (GetBraveCoreInstallPath()) {
    return false
  }

  // brave-core is not installed; go ahead with silent install
  const cmd = getBraveCoreInstallerPath() + ' /silent /install'
  try {
    execSync(cmd)
  } catch (e) {
    console.log('Error thrown when installing brave-core: ' + e.toString())
    return false
  }

  return true
}

// windows installation events etc...
if (process.platform === 'win32') {
  const shouldQuit = require('electron-squirrel-startup')
  const channel = Channel.channel()
  const isSquirrelInstall = process.argv.includes('--squirrel-install')
  const isSquirrelUpdate = process.argv.includes('--squirrel-updated')
  const isSquirrelUninstall = process.argv.includes('--squirrel-uninstall')
  const isSquirrelFirstRun = process.argv.includes('--squirrel-firstrun')
  // handle running as part of install process
  if (isSquirrelInstall) {
    // determine if promo code was provided by setup.exe
    const promoCode = cmdLine.getFirstRunPromoCode()
    if (promoCode) {
      // write promo code so state can access it
      promoCodeFirstRunStorage.writeFirstRunPromoCodeSync(promoCode)
    }
  }

  // first-run after install / update
  if (isSquirrelInstall || isSquirrelUpdate) {
    // The manifest file is used to customize the look of the Start menu tile.
    // This function copies it from the versioned folder to the parent folder
    // (where the auto-update executable lives)
    CopyManifestFile()
    // Launch defaults helper to add defaults on install
    spawn(getBraveDefaultsBinPath(), [], { detached: true })
  } else if (isSquirrelUninstall) {
    // Launch defaults helper to remove defaults on uninstall
    // Sync to avoid file path in use on uninstall
    spawnSync(getBraveDefaultsBinPath(), ['-uninstall'])
  }

  // Events like `--squirrel-install` and `--squirrel-updated`
  // are fired by Update.exe DURING the install/upgrade. Since
  // we don't intend to actually launch the executable, we need
  // to exit. The user will then pick "Relaunch" at their leisure
  //
  // This logic also creates the shortcuts (desktop, etc)
  if (shouldQuit(channel)) {
    process.exit(0)
  }

  const userDataDirSwitch = '--user-data-dir-name=brave-' + channel
  if (channel !== 'dev' && !process.argv.includes(userDataDirSwitch) &&
      !process.argv.includes('--relaunch') &&
      !process.argv.includes('--user-data-dir-name=brave-development')) {
    delete process.env.CHROME_USER_DATA_DIR
    if (isSquirrelFirstRun) {
      app.relaunch({args: [userDataDirSwitch, '--relaunch']})
    } else {
      app.relaunch({args: process.argv.slice(1).concat([userDataDirSwitch, '--relaunch'])})
    }
    app.exit()
    return
  }

  // silent install brave-core
  // TODO: store install attempt in appState https://github.com/brave/brave-browser/issues/1911
  if (true) {
    if (InstallBraveCore()) {
      // relaunch and append argument expected in:
      // https://github.com/brave/brave-browser/issues/1545
      const installedPath = GetBraveCoreInstallPath()
      execSync(`"${installedPath}/brave.exe" --upgrade-from-muon`)
      app.exit()
    }
  }
}

app.on('will-finish-launching', () => {
  app.setAppUserModelId(appUserModelId)
})
