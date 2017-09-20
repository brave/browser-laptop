/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {StyleSheet} = require('aphrodite')
const globalStyles = require('./global')

const styles = StyleSheet.create({
  // Windows specific style
  tabForWindows: {
    color: '#555'
  },

  tab: {
    borderWidth: '0 1px 0 0',
    borderStyle: 'solid',
    borderColor: '#bbb',
    boxSizing: 'border-box',
    color: '#5a5a5a',
    display: 'flex',
    marginTop: '0',
    transition: `transform 200ms ease, ${globalStyles.transition.tabBackgroundTransition}`,
    left: '0',
    opacity: '1',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: globalStyles.spacing.defaultTabPadding,
    position: 'relative',

    // globalStyles.spacing.tabHeight has been set to globalStyles.spacing.tabsToolbarHeight,
    // which is 1px extra due to the border-top of .tabsToolbar
    height: `calc(${globalStyles.spacing.tabsToolbarHeight} - 1px)`,

    ':hover': {
      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(250, 250, 250, 0.4))'
    }
  },

  // Custom classes based on tab's width and behaviour
  tabNarrowView: {
    padding: '0 2px'
  },

  narrowViewPlayIndicator: {
    '::before': {
      content: `''`,
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'lightskyblue'
    }
  },

  tabNarrowestView: {
    justifyContent: 'center'
  },

  tabMinAllowedSize: {
    padding: 0
  },

  tabIdNarrowView: {
    flex: 'inherit'
  },

  tabIdMinAllowedSize: {
    overflow: 'hidden'
  },

  alternativePlayIndicator: {
    borderTop: '2px solid lightskyblue'
  },

  tabId: {
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flex: '1',

    // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1108514#c5
    minWidth: '0',

    // prevent the icons wrapper from being the target of mouse events.
    pointerEvents: 'none'
  },

  isPinned: {
    padding: 0,
    width: `calc(${globalStyles.spacing.tabsToolbarHeight} * 1.1)`,
    justifyContent: 'center'
  },

  active: {
    background: `rgba(255, 255, 255, 1.0)`,
    marginTop: '0',
    borderWidth: '0 1px 0 0',
    borderStyle: 'solid',
    borderColor: '#bbb',
    color: '#000',

    ':hover': {
      background: `linear-gradient(to bottom, #fff, ${globalStyles.color.chromePrimary})`
    }
  },

  activePrivateTab: {
    background: globalStyles.color.privateTabBackgroundActive,

    ':hover': {
      background: globalStyles.color.privateTabBackgroundActive
    }
  },

  private: {
    background: 'rgba(75, 60, 110, 0.2)',

    ':hover': {
      background: globalStyles.color.privateTabBackgroundActive
    }
  },

  dragging: {
    ':hover': {
      closeTab: {
        opacity: '0'
      }
    }
  },

  icon: {
    width: globalStyles.spacing.iconSize,
    minWidth: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize,
    backgroundSize: globalStyles.spacing.iconSize,
    fontSize: globalStyles.fontSize.tabIcon,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    paddingLeft: globalStyles.spacing.defaultIconPadding,
    paddingRight: globalStyles.spacing.defaultIconPadding
  },

  icon_audio: {
    color: globalStyles.color.highlightBlue,

    // 16px
    fontSize: `calc(${globalStyles.fontSize.tabIcon} + 2px)`,

    // equal spacing around audio icon (favicon and tabTitle)
    padding: globalStyles.spacing.defaultTabPadding,
    paddingRight: '0 !important'
  }
})

module.exports = styles
