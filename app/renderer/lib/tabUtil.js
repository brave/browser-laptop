/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabBreakpoint = require('../components/styles/global').breakpoint.tab

/**
 * Get tab's breakpoint name for current tab size.
 * @param {Number} tabWidth current tab size
 * @returns {String} The matching breakpoint.
 */
module.exports.getTabBreakpoint = (tabWidth) => {
  const sizes = Object.keys(tabBreakpoint)
  let currentSize

  sizes.map(size => {
    if (tabWidth <= Number.parseInt(tabBreakpoint[size], 10)) {
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
 * @param {Object} breakpoint - Break point value
 * @param {Array} arr - Array of Strings including breakpoint names to check against
 * @returns {Boolean} Whether or not the sizing criteria was match
 */
module.exports.hasBreakpoint = (breakpoint, arr) => {
  arr = Array.isArray(arr) ? arr : [arr]
  return arr.includes(breakpoint)
}

/**
 * Check whether or not the related target is a tab
 * by checking the parentNode dataset
 * @param {Object} event - The mouse event
 * @returns {Boolean} Whether or not the related target is a tab
 */
module.exports.hasTabAsRelatedTarget = (event) => {
  let tabAsRelatedTarget = false
  const relatedTarget = event && event.relatedTarget

  if (relatedTarget != null) {
    const hasDataset = relatedTarget.parentNode && relatedTarget.parentNode.dataset
    if (hasDataset != null) {
      tabAsRelatedTarget = (hasDataset.tab || hasDataset.tabArea) || false
    }
  }
  return tabAsRelatedTarget
}
