/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const styles = require('../components/styles/global')

/**
 * Get tab's breakpoint name for current tab size.
 * @param {Number} The current tab size
 * @returns {String} The matching breakpoint.
 */
module.exports.getTabBreakpoint = (tabWidth) => {
  const sizes = ['largeMedium', 'medium', 'mediumSmall', 'small', 'extraSmall', 'smallest']
  let currentSize

  sizes.map(size => {
    if (tabWidth <= Number.parseInt(styles.breakpoint.tab[size], 10)) {
      currentSize = size
      return false
    }
    return true
  })
  return currentSize
}

// Execute resize handler at a rate of 15fps
module.exports.tabUpdateFrameRate = 66
