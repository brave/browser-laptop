/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Constants
const settings = require('../../../js/constants/settings')
const {braveExtensionId} = require('../../../js/constants/config')

// Utils
const locale = require('../../../js/l10n')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const {getTextColorForBackground} = require('../../../js/lib/color')
const {hasBreakpoint} = require('../../renderer/lib/tabUtil')
const {getSetting} = require('../../../js/settings')

// Styles
const styles = require('../../renderer/components/styles/global')

const tabContentState = {
  getDisplayTitle: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)

    if (frame == null) {
      return ''
    }

    // For renderer initiated navigation, make sure we show Untitled
    // until we know what we're loading.  We should probably do this for
    // all about: pages that we already know the title for so we don't have
    // to wait for the title to be parsed.
    if (frame.get('location') === 'about:blank') {
      return locale.translation('aboutBlankTitle')
    } else if (frame.get('location') === 'about:newtab') {
      return locale.translation('newTab')
    }

    // YouTube tries to change the title to add a play icon when
    // there is audio. Since we have our own audio indicator we get
    // rid of it.
    return (frame.get('title') || frame.get('location') || '').replace('▶ ', '')
  },

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

  canPlayAudio (state, frameKey) {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)

    if (frame == null) {
      return false
    }

    return frame.get('audioPlaybackActive') || frame.get('audioMuted')
  },

  isTabLoading: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)

    if (frame == null) {
      return false
    }

    return (
      frame.get('loading') ||
      frame.get('location') === 'about:blank'
    ) &&
    (
      !frame.get('provisionalLocation') ||
      !frame.get('provisionalLocation').startsWith(`chrome-extension://${braveExtensionId}/`)
    )
  },

  getPageIndex: (state) => {
    const tabPageIndex = state.getIn(['ui', 'tabs', 'tabPageIndex'], 0)
    const previewTabPageIndex = state.getIn(['ui', 'tabs', 'previewTabPageIndex'])

    return previewTabPageIndex != null ? previewTabPageIndex : tabPageIndex
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
   * Check whether or not closeTab icon is always visible (fixed) in tab
   */
  hasFixedCloseIcon: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)
    const isActive = frameStateUtil.isFrameKeyActive(state, frameKey)

    if (frame == null) {
      return false
    }

    return (
      isActive &&
      // Larger sizes still have a relative closeIcon
      // We don't resize closeIcon as we do with favicon so don't show it (smallest)
      !hasBreakpoint(frame.get('breakpoint'), ['default', 'large', 'smallest'])
    )
  },

  /**
   * Check whether or not closeTab icon is relative to hover state
   */
  hasRelativeCloseIcon: (state, frameKey) => {
    const frame = frameStateUtil.getFrameByKey(state, frameKey)

    if (frame == null) {
      return false
    }

    return frameStateUtil.getTabHoverState(state, frameKey) &&
      hasBreakpoint(frame.get('breakpoint'), ['default', 'large'])
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
      !tabContentState.hasRelativeCloseIcon(state, frameKey) &&
      // If closeIcon is fixed then there's no room for another icon
      !tabContentState.hasFixedCloseIcon(state, frameKey) &&
      // completely hide it for small sizes
      !hasBreakpoint(frame.get('breakpoint'),
        ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest'])
    )
  }
}

module.exports = tabContentState
