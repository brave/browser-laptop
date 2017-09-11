/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Constants
const settings = require('../../../js/constants/settings')

// State helpers
const closeState = require('./tabContentState/closeState')
const frameStateUtil = require('../../../js/state/frameStateUtil')

// Utils
const {getTextColorForBackground} = require('../../../js/lib/color')
const {hasBreakpoint} = require('../../renderer/lib/tabUtil')
const {getSetting} = require('../../../js/settings')

// Styles
const styles = require('../../renderer/components/styles/global')

const tabUIState = {
  hasTabInFullScreen: (state) => {
    return state.get('frames')
      .map((frame) => frame.get('isFullScreen'))
      .some(fullScreenMode => fullScreenMode === true)
  },

  getThemeColor: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)

    if (frame == null) {
      return false
    }

    return getSetting(settings.PAINT_TABS) && (frame.get('themeColor') || frame.get('computedThemeColor'))
  },

  isMediumView: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)
    return frame
      ? ['large', 'largeMedium'].includes(frame.get('breakpoint'))
      : false
  },

  isNarrowView: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)
    return frame
      ? ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest'].includes(frame.get('breakpoint'))
      : false
  },

  isNarrowestView: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)
    return frame
      ? ['extraSmall', 'smallest'].includes(frame.get('breakpoint'))
      : false
  },

  getTabIconColor: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)
    const isActive = frameStateUtil.isFrameKeyActive(state, frameKey)
    const hoverState = frameStateUtil.getTabHoverState(state, frameKey)

    if (frame == null) {
      return ''
    }

    const themeColor = frame.get('themeColor') || frame.get('computedThemeColor')
    const activeNonPrivateTab = !frame.get('isPrivate') && isActive
    const isPrivateTab = frame.get('isPrivate') && (isActive || hoverState)
    const defaultColor = isPrivateTab ? styles.color.white100 : styles.color.black100
    const isPaintTabs = getSetting(settings.PAINT_TABS)

    return activeNonPrivateTab && isPaintTabs && !!themeColor
      ? getTextColorForBackground(themeColor)
      : defaultColor
  },

  /**
   * Check whether or not private or newSession icon should be visible
   */
  hasVisibleSecondaryIcon: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)

    if (frame == null) {
      return false
    }

    return (
      // Hide icon on hover
      !closeState.hasRelativeCloseIcon(state, frameKey) &&
      // If closeIcon is fixed then there's no room for another icon
      !closeState.hasFixedCloseIcon(state, frameKey) &&
      // completely hide it for small sizes
      !hasBreakpoint(frame.get('breakpoint'),
        ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest'])
    )
  }
}

module.exports = tabUIState
