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
const appUserModelId = 'com.squirrel.brave.Brave'

const getBraveBinPath = () => {
  const appPath = app.getPath('exe')
  return path.dirname(appPath)
}

const getBraveDefaultsBinPath = () => {
  const appDir = getBraveBinPath()
  return path.join(appDir, 'resources', 'braveDefaults.exe')
}

function CopyManifestFile () {
  const versionedRoot = getBraveBinPath()
  let updateRoot = versionedRoot.split('\\')
  updateRoot.pop()
  updateRoot = updateRoot.join('\\')
  const cmd = 'copy "' + path.join(versionedRoot, 'Update.VisualElementsManifest.xml') + '" "' + updateRoot + '"'
  execSync(cmd)
}

 // windows installation events etc...
if (process.platform === 'win32') {
  const shouldQuit = require('electron-squirrel-startup')
  const cmd = process.argv[1]
  if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') {
    // The manifest file is used to customize the look of the Start menu tile.
    // This function copies it from the versioned folder to the parent folder
    // (where the auto-update executable lives)
    CopyManifestFile()
    // Launch defaults helper to add defaults on install
    spawn(getBraveDefaultsBinPath(), [], { detached: true })
  } else if (cmd === '--squirrel-uninstall') {
    // Launch defaults helper to remove defaults on uninstall
    // Sync to avoid file path in use on uninstall
    spawnSync(getBraveDefaultsBinPath(), ['-uninstall'])
  }

  if (shouldQuit) {
    process.exit(0)
  }
}

app.on('will-finish-launching', () => {
  app.setAppUserModelId(appUserModelId)
})
