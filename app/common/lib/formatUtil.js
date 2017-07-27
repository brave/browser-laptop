/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const macOrderLookup = (value) => {
  switch (value) {
    case 'Alt':
    case 'Option':
    case 'AltGr':
      return 0
    case 'Shift':
      return 1
    case 'Control':
    case 'Ctrl':
      return 2
    case 'Super':
    case 'CmdOrCtrl':
    case 'CommandOrControl':
    case 'Command':
    case 'Cmd':
      return 3
    default:
      return 4
  }
}
const defaultOrderLookup = (value) => {
  switch (value) {
    case 'CmdOrCtrl':
    case 'CommandOrControl':
    case 'Control':
    case 'Ctrl':
      return 0
    case 'Alt':
    case 'AltGr':
      return 1
    case 'Shift':
      return 2
    default:
      return 3
  }
}

/**
 * Format an electron accelerator in the order you'd expect in a menu
 * Accelerator reference: https://github.com/electron/electron/blob/master/docs/api/accelerator.md
 */
module.exports.formatAccelerator = (accelerator) => {
  let result
  let splitResult = accelerator.split('+')
  // sort in proper order, based on OS
  // also, replace w/ name or symbol
  if (process.platform === 'darwin') {
    splitResult.sort(function (left, right) {
      if (macOrderLookup(left) === macOrderLookup(right)) return 0
      if (macOrderLookup(left) > macOrderLookup(right)) return 1
      return -1
    })
    // NOTE: these characters might only show properly on Mac
    result = splitResult.join('')
    result = result.replace('CommandOrControl', '⌘')
    result = result.replace('CmdOrCtrl', '⌘')
    result = result.replace('Command', '⌘')
    result = result.replace('Cmd', '⌘')
    result = result.replace('Alt', '⌥')
    result = result.replace('AltGr', '⌥')
    result = result.replace('Super', '⌘')
    result = result.replace('Option', '⌥')
    result = result.replace('Shift', '⇧')
    result = result.replace('Control', '^')
    result = result.replace('Ctrl', '^')
  } else {
    splitResult.sort(function (left, right) {
      if (defaultOrderLookup(left) === defaultOrderLookup(right)) return 0
      if (defaultOrderLookup(left) > defaultOrderLookup(right)) return 1
      return -1
    })
    result = splitResult.join('+')
    result = result.replace('CommandOrControl', 'Ctrl')
    result = result.replace('CmdOrCtrl', 'Ctrl')
    result = result.replace('Control', 'Ctrl')
  }
  return result
}

module.exports.toLocaleString = (epoch, defaultValue) => {
  if (epoch && typeof epoch === 'number') {
    try {
      const date = new Date(epoch).toLocaleString()
      if (date !== 'Invalid Date') {
        return date
      }
    } catch (e) {
      console.log('Error parsing date: ', e)
    }
  }
  return defaultValue || ''
}

/**
 * Clamp values down to a given range (min/max).
 * Value is wrapped when out of bounds. ex:
 *   min-1 = max
 *   max+1 = min
 */
module.exports.wrappingClamp = (value, min, max) => {
  const range = (max - min) + 1
  return value - (Math.floor((value - min) / range) * range)
}
