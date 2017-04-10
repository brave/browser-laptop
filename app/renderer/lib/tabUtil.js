/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const styles = require('../components/styles/global')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const {getTextColorForBackground} = require('../../../js/lib/color')

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
 * Check whether or not private or newSession icon should be visible
 * @param {Object} props - Object that hosts the tab props
 * @returns {Boolean} Whether or not private or newSession icon should be visible
 */
module.exports.hasVisibleSecondaryIcon = (props) => {
  return !props.tab.get('hoverState') &&
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

/**
 * Gets the icon color based on tab's background
 * @param {Object} props - Object that hosts the tab props
 * @returns {String} Contrasting color to use based on tab's color
 */
module.exports.getTabIconColor = (props) => {
  const themeColor = props.tab.get('themeColor') || props.tab.get('computedThemeColor')
  const activeNonPrivateTab = !props.tab.get('isPrivate') && props.isActive
  const isPrivateTab = props.tab.get('isPrivate') && (props.isActive || props.tab.get('hoverState'))
  const defaultColor = isPrivateTab ? styles.color.white100 : styles.color.black100

  return activeNonPrivateTab && props.paintTabs && !!themeColor
    ? getTextColorForBackground(themeColor)
    : defaultColor
}

/**
 * Updates the tab page index to the specified frameProps
 * @param frameProps Any frame belonging to the page
 */
module.exports.updateTabPageIndex = (state, frameProps) => {
  // No need to update tab page index if we are given a pinned frame
  if (!frameProps || frameProps.get('pinnedLocation')) {
    return state
  }

  const index = frameStateUtil.getFrameTabPageIndex(state.get('frames')
      .filter((frame) => !frame.get('pinnedLocation')), frameProps, getSetting(settings.TABS_PER_PAGE))

  if (index === -1) {
    return state
  }

  state = state.setIn(['ui', 'tabs', 'tabPageIndex'], index)
  state = state.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])

  return state
}
