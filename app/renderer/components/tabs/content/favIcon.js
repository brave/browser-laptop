/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State
const faviconState = require('../../../../common/state/tabContentState/faviconState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabUIState = require('../../../../common/state/tabUIState')
const tabState = require('../../../../common/state/tabState')

// Styles
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')
const {spinKeyframes, opacityIncreaseElementKeyframes} = require('../../styles/animations')

const defaultIconSvg = require('../../../../extensions/brave/img/tabs/default.svg')
const loadingIconSvg = require('../../../../extensions/brave/img/tabs/loading.svg')

const isLocalFavicon = (favicon) => {
  if (!favicon) {
    return true
  }
  favicon = favicon.toLowerCase()
  return favicon.startsWith('data:') ||
    favicon.startsWith('chrome:') ||
    favicon.startsWith('chrome-extension://') ||
    favicon.startsWith('file://')
}

class Favicon extends React.Component {
  constructor (props) {
    super(props)
    this.setRef = this.setRef.bind(this)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)
    const frame = frameStateUtil.getFrameByKey(currentWindow, frameKey)

    const props = {}
    props.isPinned = tabState.isTabPinned(state, tabId)
    props.isTor = frameStateUtil.isTor(frame)
    props.favicon = faviconState.getFavicon(currentWindow, frameKey)
    props.showIcon = faviconState.showFavicon(currentWindow, frameKey)
    props.tabLoading = faviconState.showLoadingIcon(currentWindow, frameKey)
    props.tabIconColor = tabUIState.getTabIconColor(currentWindow, frameKey)
    props.showIconWithLessMargin = faviconState.showIconWithLessMargin(currentWindow, frameKey)
    props.showIconAtReducedSize = faviconState.showFaviconAtReducedSize(currentWindow, frameKey)
    props.tabId = tabId

    return props
  }

  get testingIcon () {
    // this is only for testing purposes
    return this.props.tabLoading
      ? 'loading'
      : this.props.favicon || 'defaultIcon'
  }

  componentDidMount (props) {
    this.transitionInIfRequired()
  }

  componentDidUpdate (prevProps) {
    this.transitionInIfRequired(prevProps)
  }

  transitionInIfRequired (prevProps) {
    const shouldTransitionIn = (
      // need to have the element created already
      this.element &&
      // we do not transition the loading animation
      !this.props.tabLoading &&
      // only if the icon changes (or is new)
      (!prevProps || this.props.favicon !== prevProps.favicon)
    )
    if (shouldTransitionIn) {
      this.element.animate(opacityIncreaseElementKeyframes, {
        duration: 200,
        easing: 'linear'
      })
    }
  }

  setRef (ref) {
    this.element = ReactDOM.findDOMNode(ref)
  }

  render () {
    if (!this.props.isPinned && !this.props.showIcon) {
      return null
    }

    const themeLight = this.props.tabIconColor === 'white'
    const instanceStyles = { }
    if (this.props.favicon && (!this.props.isTor || isLocalFavicon(this.props.favicon))) {
      // Ensure that remote favicons do not load in Tor mode
      instanceStyles['--faviconsrc'] = `url(${this.props.favicon})`
    }

    return <TabIcon
      data-test-favicon={this.props.favicon}
      data-test-id={this.testingIcon}
      className={[
        this.props.favicon && styles.icon_fav,
        (this.props.favicon && themeLight) && styles.icon_favLight,
        (!this.props.isPinned && this.props.showIconWithLessMargin) && styles.icon_lessMargin,
        (!this.props.isPinned && this.props.showIconAtReducedSize) && styles.icon_reducedSize
      ]}
      style={instanceStyles}
      ref={this.setRef}
      symbol={
        this.props.tabLoading
          ? (
            // no loading icon if there's no room for the icon
            !this.props.showIconAtReducedSize &&
            css(
              styles.icon__symbol_loading,
              themeLight && styles.icon__symbol_loading_colorLight
            )
          )
          : (
            !this.props.favicon &&
            css(
              styles.icon__symbol_default,
              this.props.showIconAtReducedSize && styles.icon__symbol_default_reducedSize
            )
          )
      } />
  }
}

const styles = StyleSheet.create({
  icon_fav: {
    backgroundImage: 'var(--faviconsrc)',
    overflow: 'visible'
  },

  icon_favLight: {
    filter: theme.filter.whiteShadow
  },

  icon_lessMargin: {
    margin: 0
  },

  icon_reducedSize: {
    width: globalStyles.spacing.narrowIconSize,
    height: '-webkit-fill-available',
    alignItems: 'center',
    backgroundSize: globalStyles.spacing.narrowIconSize
  },

  icon__symbol_loading: {
    position: 'absolute',
    left: 0,
    backgroundImage: `url(${loadingIconSvg})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top left',
    animationName: spinKeyframes,
    animationTimingFunction: 'linear',
    animationDuration: '1200ms',
    animationIterationCount: 'infinite'
  },

  icon__symbol_loading_colorLight: {
    filter: theme.filter.whiteShadow
  },

  icon__symbol_default: {
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskImage: `url(${defaultIconSvg})`,
    WebkitMaskSize: '14px',
    backgroundColor: 'var(--tab-default-icon-color)'
  },

  icon__symbol_default_reducedSize: {
    WebkitMaskSize: '10px'
  }
})

module.exports = ReduxComponent.connect(Favicon)
