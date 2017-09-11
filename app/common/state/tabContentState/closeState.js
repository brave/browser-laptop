/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {hasBreakpoint} = require('../../../renderer/lib/tabUtil')

 /**
 * Check whether or not closeTab icon is always visible (fixed) in tab
 */
module.exports.hasFixedCloseIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)
  const isActive = frameStateUtil.isFrameKeyActive(state, frameKey)

  if (frame == null) {
    return false
  }

  return (
    isActive &&
    // Larger sizes still have a relative closeIcon
    // We don't resize closeIcon as we do with favicon so don't show it (smallest)
    !hasBreakpoint(frame.get('breakpoint'), ['dynamic', 'default', 'large', 'smallest'])
  )
}

/**
 * Check whether or not closeTab icon is relative to hover state
 */
module.exports.hasRelativeCloseIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return frameStateUtil.getTabHoverState(state, frameKey) &&
    hasBreakpoint(frame.get('breakpoint'), ['dynamic', 'default', 'large'])
}
