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
const tabState = require('../../../../common/state/tabState')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const {isSourceAboutUrl} = require('../../../../../js/lib/appUrlUtil')

// Styles
const globalStyles = require('../../styles/global')
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
    const tabId = frame.get('tabId', tabState.TAB_ID_NONE)

    const props = {}

    // used in renderer

    // there's no need to show loading icon for about pages
    props.isTabLoading = !isSourceAboutUrl(frame.get('location')) && isTabLoading
    props.favicon = !isTabLoading && frame.get('icon')
    props.isPinnedTab = tabState.isTabPinned(state, tabId)
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
        styles.icon,
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

  faviconNarrowView: {
    minWidth: 'auto',
    width: globalStyles.spacing.narrowIconSize,
    backgroundSize: 'contain',
    padding: 0,
    fontSize: '10px',
    backgroundPosition: 'center center'
  },

  loadingIcon: {
    willChange: 'transform',
    backgroundImage: `url(${loadingIconSvg})`,
    animationName: spinKeyframes,
    animationTimingFunction: 'linear',
    animationDuration: '1200ms',
    animationIterationCount: 'infinite'
  }
})
