/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Constants
const settings = require('../../../js/constants/settings')

// State helpers
const closeState = require('../../common/state/tabContentState/closeState')
const frameStateUtil = require('../../../js/state/frameStateUtil')

// Utils
const {isEntryIntersected} = require('../../../app/renderer/lib/observerUtil')
const {getTextColorForBackground} = require('../../../js/lib/color')
const {hasBreakpoint} = require('../../renderer/lib/tabUtil') // TODO deprecate

// Settings
const {getSetting} = require('../../../js/settings')

// Styles
const {intersection} = require('../../renderer/components/styles/global')
// const {theme} = require('../../renderer/components/styles/theme')

// ///////////////////////////////////////////
// methods to deprecate after the observer
// ///////////////////////////////////////////

module.exports.hasTabInFullScreen = (state) => {
  return state.get('frames')
    .map((frame) => frame.get('isFullScreen'))
    .some(fullScreenMode => fullScreenMode === true)
}

module.exports.isMediumView = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)
  return frame
    ? ['large', 'largeMedium'].includes(frame.get('breakpoint'))
    : false
}

module.exports.isNarrowView = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)
  return frame
    ? ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest'].includes(frame.get('breakpoint'))
    : false
}

module.exports.isNarrowestView = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)
  return frame
    ? ['extraSmall', 'smallest'].includes(frame.get('breakpoint'))
    : false
}

/**
 * Check whether or not private or newSession icon should be visible
 */
module.exports.hasVisibleSecondaryIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return (
    // Hide icon on hover
    !closeState.deprecatedHasRelativeCloseIcon(state, frameKey) &&
    // If closeIcon is fixed then there's no room for another icon
    !closeState.deprecatedHasFixedCloseIcon(state, frameKey) &&
    // completely hide it for small sizes
    !hasBreakpoint(frame.get('breakpoint'),
      ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest'])
  )
}

// ///////////////////////////////////////////
// end of methods to deprecate
// ///////////////////////////////////////////

module.exports.getThemeColor = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for getThemeColor method')
    }
    return false
  }

  return (
    getSetting(settings.PAINT_TABS) &&
    (frame.get('themeColor') || frame.get('computedThemeColor'))
  )
}

module.exports.getTabIconColor = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for getTabIconColor method')
    }
    return ''
  }

  const isPrivate = frame.get('isPrivate')
  const isActive = frameStateUtil.isFrameKeyActive(state, frameKey)
  const hoverState = frameStateUtil.getTabHoverState(state, frameKey)
  const themeColor = frame.get('themeColor') || frame.get('computedThemeColor')
  const activeNonPrivateTab = !isPrivate && isActive
  const isPrivateTab = isPrivate && (isActive || hoverState)
  const defaultColor = isPrivateTab ? 'white' : 'black'
  const isPaintTabs = getSetting(settings.PAINT_TABS)

  return activeNonPrivateTab && isPaintTabs && !!themeColor
    ? getTextColorForBackground(themeColor)
    : defaultColor
}

module.exports.checkIfTextColor = (state, frameKey, color) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for checkIfTextColor method')
    }
    return false
  }

  return module.exports.getTabIconColor(state, frameKey) === color
}

module.exports.showTabEndIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for showTabEndIcon method')
    }
    return false
  }

  return (
    !closeState.hasFixedCloseIcon(state, frameKey) &&
    !closeState.hasRelativeCloseIcon(state, frameKey) &&
    !isEntryIntersected(state, 'tabs', intersection.at40)
  )
}

module.exports.addExtraGutterToTitle = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for addExtraGutterToTitle method')
    }
    return false
  }

  return frameStateUtil.frameLocationMatch(frame, 'about:newtab')
}

module.exports.centralizeTabIcons = (state, frameKey, isPinned) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for centralizeTabIcons method')
    }
    return false
  }

  return isPinned || isEntryIntersected(state, 'tabs', intersection.at40)
}
