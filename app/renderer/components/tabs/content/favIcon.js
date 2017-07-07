/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State
const tabContentState = require('../../../../common/state/tabContentState')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')
const tabStyles = require('../../styles/tab')
const {spinKeyframes} = require('../../styles/animations')
const loadingIconSvg = require('../../../../extensions/brave/img/tabs/loading.svg')

class Favicon extends React.Component {
  get defaultIcon () {
    return (!this.props.isTabLoading && !this.props.favicon)
      ? globalStyles.appIcons.defaultIcon
      : null
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frameKey = ownProps.frameKey
    const frame = frameStateUtil.getFrameByKey(currentWindow, frameKey) || Immutable.Map()
    const isTabLoading = tabContentState.isTabLoading(currentWindow, frameKey)

    const props = {}
    // used in renderer
    props.isTabLoading = isTabLoading
    props.favicon = !isTabLoading && frame.get('icon')
    props.isPinnedTab = frameStateUtil.isPinned(currentWindow, frameKey)
    props.tabIconColor = tabContentState.getTabIconColor(currentWindow, frameKey)
    props.isNarrowestView = tabContentState.isNarrowestView(currentWindow, frameKey)

    // used in functions
    props.frameKey = frameKey

    return props
  }

  render () {
    const iconStyles = StyleSheet.create({
      favicon: {
        backgroundImage: `url(${this.props.favicon})`,
        filter: this.props.tabIconColor === 'white' ? globalStyles.filter.whiteShadow : 'none'
      },
      loadingIconColor: {
        // Don't change icon color unless when it should be white
        filter: this.props.tabIconColor === 'white' ? globalStyles.filter.makeWhite : 'none'
      }
    })

    return <TabIcon
      data-test-favicon={this.props.favicon}
      data-test-id={this.props.isTabLoading ? 'loading' : 'defaultIcon'}
      className={css(
        tabStyles.icon,
        this.props.favicon && iconStyles.favicon,
        !this.props.isPinnedTab && this.props.isNarrowestView && styles.faviconNarrowView
      )}
      symbol={
        (this.props.isTabLoading && css(styles.loadingIcon, iconStyles.loadingIconColor)) ||
        this.defaultIcon
      } />
  }
}

module.exports = ReduxComponent.connect(Favicon)

const styles = StyleSheet.create({
  faviconNarrowView: {
    minWidth: 'auto',
    width: globalStyles.spacing.narrowIconSize,
    backgroundSize: 'contain',
    padding: 0,
    fontSize: '10px',
    backgroundPosition: 'center center'
  },

  loadingIcon: {
    backgroundImage: `url(${loadingIconSvg})`,
    animationName: spinKeyframes,
    animationTimingFunction: 'linear',
    animationDuration: '1200ms',
    animationIterationCount: 'infinite'
  }
})
