/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

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
