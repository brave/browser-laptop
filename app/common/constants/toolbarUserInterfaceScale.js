/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const scaleSize = {
  SMALLER: 'smaller',
  NORMAL: 'normal',
  LARGER: 'larger',
  SUPERSIZE: 'supersize'
}

let zoomLevel = {}
zoomLevel[scaleSize.SMALLER] = -0.5
zoomLevel[scaleSize.NORMAL] = 0.0
zoomLevel[scaleSize.LARGER] = 1.0
zoomLevel[scaleSize.SUPERSIZE] = 3.0

module.exports = {
  scaleSize,
  zoomLevel
}
