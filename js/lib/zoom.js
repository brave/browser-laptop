/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {zoom} = require('../constants/config')

// Each zoomLevel is multiplied by 20 to get the percentage offset from 100
module.exports.getZoomValuePercentage = (zoomLevel) =>
  100 + (20 * zoomLevel)

module.exports.getNextZoomLevel = (currentZoom, zoomIn) => {
  const zoomLevels = zoom.zoomLevels
  // First find the closet value to what we allow
  const closestIndex = zoomLevels
    .reduce((result, zoomLevel, i) =>
      Math.abs(currentZoom - zoomLevel) < result.value
        ? { index: i, value: Math.abs(currentZoom - zoomLevel) }
        : result, { index: 0, value: Number.MAX_VALUE })
    .index

  // Then check for caps
  if (zoomIn && closestIndex === zoomLevels.length - 1) {
    return zoomLevels[zoomLevels.length - 1]
  }
  if (!zoomIn && closestIndex === 0) {
    return zoomLevels[0]
  }

  // Otherwise return 1 higher or lower depending on if they are zooming in or out
  return zoomLevels[(zoomIn ? 1 : -1) + closestIndex]
}
