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
  const sizes = ['large', 'largeMedium', 'medium', 'mediumSmall', 'small', 'extraSmall', 'smallest']
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

/**
 * Check whether or not current breakpoint match defined criteria
 * @param {Object} props - Object that hosts the tab breakpoint
 * @param {Array} arr - Array of Strings including breakpoint names to check against
 * @returns {Boolean} Whether or not the sizing criteria was match
 */
module.exports.hasBreakpoint = (props, arr) => {
  arr = Array.isArray(arr) ? arr : [arr]
  return arr.includes(props.tab.get('breakpoint'))
}

/**
 * Check whether or not closeTab icon is relative to hover state
 * @param {Object} props - Object that hosts the tab props
 * @returns {Boolean} Whether or not the tab has a relative closeTab icon
 */
module.exports.hasRelativeCloseIcon = (props) => {
  return props.tab.get('hoverState') &&
    !module.exports.hasBreakpoint(props, ['small', 'extraSmall', 'smallest'])
}

/**
 * Check whether or not closeTab icon is always visible (fixed) in tab
 * @param {Object} props - Object that hosts the tab props
 * @returns {Boolean} Whether or not the close icon is always visible (fixed)
 */
module.exports.hasFixedCloseIcon = (props) => {
  return props.isActive && module.exports.hasBreakpoint(props, ['small', 'extraSmall'])
}
