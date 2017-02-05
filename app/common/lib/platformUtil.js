/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

/**
 * Get list of styles which should be applied to root window div
 * return array of strings (each being a class name)
 */
module.exports.getPlatformStyles = () => {
  const platform = process.platform
  const styleList = ['platform--' + platform]

  switch (platform) {
    case 'win32':
      if (process.platformVersion === 'win7') {
        styleList.push('win7')
      } else {
        styleList.push('win10')
      }
  }

  return styleList
}

module.exports.getPathFromFileURI = (fileURI) => {
  const path = decodeURI(fileURI)
  if (process.platform === 'win32') {
    return path.replace('file:///', '')
  } else {
    return path.replace('file://', '')
  }
}

module.exports.isDarwin = () => {
  return process.platform === 'darwin' ||
    navigator.platform === 'MacIntel'
}

module.exports.isWindows = () => {
  return process.platform === 'win32' ||
    navigator.platform === 'Win32'
}

module.exports.isLinux = () => {
  return !module.exports.isDarwin() &&
    !module.exports.isWindows()
}
