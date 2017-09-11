/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')

// State
const tabContentState = require('../../../../common/state/tabContentState')

// Utils
const {hasBreakpoint} = require('../../../lib/tabUtil')
const platformUtil = require('../../../../common/lib/platformUtil')
const isWindows = platformUtil.isWindows()
const isDarwin = platformUtil.isDarwin()

// Styles
const globalStyles = require('../../styles/global')

class TabTitle extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frameKey = ownProps.frameKey
    const tabIconColor = tabContentState.getTabIconColor(currentWindow, frameKey)

    const props = {}
    // used in renderer
    props.enforceFontVisibility = isDarwin && tabIconColor === 'white'
    props.tabIconColor = tabIconColor
    props.displayTitle = tabContentState.getDisplayTitle(currentWindow, frameKey)
    props.showTitle = !ownProps.isPinnedTab &&
    !(
      (hasBreakpoint(ownProps.breakpoint, ['mediumSmall', 'small']) && ownProps.isActive) ||
      hasBreakpoint(ownProps.breakpoint, ['extraSmall', 'smallest'])
    )
    // used in functions
    props.frameKey = frameKey

    return props
  }

  render () {
    if (!this.props.showTitle) {
      return null
    }
    const titleStyles = StyleSheet.create({
      gradientText: {
        backgroundImage: `-webkit-linear-gradient(left,
        ${this.props.tabIconColor} 90%, ${globalStyles.color.almostInvisible} 100%)`
      }
    })

    return <div data-test-id='tabTitle'
      className={css(
        styles.tabTitle,
        titleStyles.gradientText,
        this.props.enforceFontVisibility && styles.enforceFontVisibility,
        // Windows specific style
        isWindows && styles.tabTitleForWindows
      )}>
      {this.props.displayTitle}
    </div>
  }
}

module.exports = ReduxComponent.connect(TabTitle)

const styles = StyleSheet.create({
  tabTitle: {
    display: 'flex',
    flex: '1',
    userSelect: 'none',
    boxSizing: 'border-box',
    fontSize: globalStyles.fontSize.tabTitle,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    lineHeight: '1.6',
    padding: globalStyles.spacing.defaultTabPadding,
    color: 'transparent',
    WebkitBackgroundClip: 'text',
    // prevents the title from being the target of mouse events.
    pointerEvents: 'none'
  },

  enforceFontVisibility: {
    fontWeight: '600'
  },

  tabTitleForWindows: {
    fontWeight: '500',
    fontSize: globalStyles.fontSize.tabTitle
  }
})
