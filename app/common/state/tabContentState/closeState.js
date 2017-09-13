/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// State helpers
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Utils
const {isEntryIntersected} = require('../../../../app/renderer/lib/observerUtil')

// Styles
const {intersection} = require('../../../renderer/components/styles/global')

module.exports.hasFixedCloseIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return (
    frameStateUtil.isFrameKeyActive(state, frameKey) &&
    isEntryIntersected(state, 'tabs', intersection.at75)
  )
}

module.exports.hasRelativeCloseIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return (
    frameStateUtil.getTabHoverState(state, frameKey) &&
    !isEntryIntersected(state, 'tabs', intersection.at75)
  )
}

module.exports.showCloseTabIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return !isEntryIntersected(state, 'tabs', intersection.at20) &&
    (
      module.exports.hasRelativeCloseIcon(state, frameKey) ||
      module.exports.hasFixedCloseIcon(state, frameKey)
    )
}
