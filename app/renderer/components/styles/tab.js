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
    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))',
    borderRadius: `${globalStyles.radius.borderRadiusTabs} ${globalStyles.radius.borderRadiusTabs} 0 0`,
    borderWidth: '1px 1px 0',
    borderStyle: 'solid',
    borderColor: 'transparent',
    boxSizing: 'border-box',
    color: '#3B3B3B',
    display: 'flex',
    height: '23px',
    marginTop: '2px',
    transition: `transform 200ms ease, ${globalStyles.transition.tabBackgroundTransition}`,
    left: '0',
    opacity: '1',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: globalStyles.spacing.defaultTabPadding,
    position: 'relative',

    ':hover': {
      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(250, 250, 250, 0.4))'
    }
  },

  // Custom classes based on tab's width and behaviour

  tabNarrowView: {
    padding: '0 2px'
  },

  narrowViewPlayIndicator: {
    borderWidth: '2px 1px 0',
    borderStyle: 'solid',
    borderColor: 'lightskyblue transparent transparent'
  },

  activeTabNarrowViewPlayIndicator: {
    borderColor: `lightskyblue ${globalStyles.color.chromeControlsBackground} ${globalStyles.color.chromeControlsBackground}`
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

  // Add extra space for pages that have no icon
  // such as about:blank and about:newtab
  noFavicon: {
    padding: '0 6px'
  },

  alternativePlayIndicator: {
    borderTop: '2px solid lightskyblue'
  },

  tabId: {
    alignItems: 'center',
    display: 'flex',
    flex: '1',
    minWidth: '0' // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1108514#c5
  },

  isPinned: {
    paddingLeft: globalStyles.spacing.defaultIconPadding,
    paddingRight: globalStyles.spacing.defaultIconPadding
  },

  active: {
    background: `linear-gradient(to bottom, #fff, ${globalStyles.color.chromePrimary})`,
    height: '25px',
    marginTop: '1px',
    boxShadow: '0 -1px 4px 0 rgba(51, 51, 51, 0.12)',
    borderWidth: '1px 1px 0',
    borderStyle: 'solid',
    borderColor: '#bbb',

    ':hover': {
      background: `linear-gradient(to bottom, #fff, ${globalStyles.color.chromePrimary})`
    }
  },

  activePrivateTab: {
    background: 'rgb(247, 247, 247)',
    color: 'black'
  },

  private: {
    background: '#9c8dc1', // (globalStyles.color.privateTabBackground, 40%)
    color: '#fff',

    ':hover': {
      background: '#665296', // (globalStyles.color.privateTabBackground, 20%)
      color: '#fff'
    }
  },

  dragging: {
    ':hover': {
      closeTab: {
        opacity: '0'
      }
    }
  }
})

module.exports = styles
