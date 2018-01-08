/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')
const TabLoadingIcon = require('../../../../../icons/loader/spin')
const DefaultDocumentIcon = require('../../../../../icons/planet')

// State
const faviconState = require('../../../../common/state/tabContentState/faviconState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabUIState = require('../../../../common/state/tabUIState')
const tabState = require('../../../../common/state/tabState')

// Styles
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')
const {opacityIncreaseElementKeyframes} = require('../../styles/animations')

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

    const inlineIcon = this.props.tabLoading
      ? <TabLoadingIcon />
      : !this.props.favicon
        ? <DefaultDocumentIcon />
        : null

    const inlineIconStyles = this.props.tabLoading
      ? css(styles.icon__symbol_loading)
      : !this.props.favicon
        ? css(styles.icon__symbol_default)
        : null

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
      symbol={inlineIconStyles}
      symbolContent={inlineIcon}
    />
  }
}

const styles = StyleSheet.create({
  icon_fav: {
    backgroundImage: 'var(--faviconsrc)',
    '--icon-line-color': '#7A7B80',
    overflow: 'visible'
  },

  icon_favLight: {
    filter: theme.filter.whiteShadow,
    '--icon-line-color': 'white'
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
    '--loader-size': globalStyles.spacing.narrowIconSize,
    '--loader-stroke': '1px'
  },

  icon__symbol_default: {
    width: '100%'
  }
})

module.exports = ReduxComponent.connect(Favicon)
