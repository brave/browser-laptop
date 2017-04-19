/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')

// Utils
const {isWindows, isDarwin} = require('../../../../common/lib/platformUtil')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')
const tabContentState = require('../../../../common/state/tabContentState')

class TabTitle extends React.Component {
  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabIconColor = frameStateUtil.getTabIconColor(currentWindow, ownProps.frameKey)

    const props = {}
    // used in renderer
    props.enforceFontVisibilty = isDarwin() && tabIconColor === 'white'
    props.tabIconColor = tabIconColor
    props.displayTitle = tabContentState.getDisplayTitle(currentWindow, ownProps.frameKey)

    // used in functions
    props.frameKey = ownProps.frameKey

    return props
  }

  render () {
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
        this.props.enforceFontVisibilty && styles.enforceFontVisibilty,
        // Windows specific style
        isWindows() && styles.tabTitleForWindows
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
    WebkitBackgroundClip: 'text'
  },

  enforceFontVisibilty: {
    fontWeight: '600'
  },

  tabTitleForWindows: {
    fontWeight: '500',
    fontSize: globalStyles.fontSize.tabTitle
  }
})
