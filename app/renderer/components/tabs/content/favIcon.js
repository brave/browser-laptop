/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State
const faviconState = require('../../../../common/state/tabContentState/faviconState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabUIState = require('../../../../common/state/tabUIState')

// Styles
const defaultIconSvg = require('../../../../extensions/brave/img/tabs/default.svg')
const loadingIconSvg = require('../../../../extensions/brave/img/tabs/loading.svg')
const {filter, color, spacing} = require('../../styles/global')
const {spinKeyframes, opacityIncreaseKeyframes} = require('../../styles/animations')

class Favicon extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)

    const props = {}
    props.isPinned = frameStateUtil.isPinned(currentWindow, frameKey)
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

  render () {
    if (!this.props.isPinned && !this.props.showIcon) {
      return null
    }

    const iconStyles = StyleSheet.create({
      icon__loading_color: {
        filter: this.props.tabIconColor === 'white'
          ? filter.makeWhite
          : 'none'
      },
      icon__favicon: {
        backgroundImage: `url(${this.props.favicon})`,
        filter: this.props.tabIconColor === 'white'
          ? filter.whiteShadow
          : 'none'
      },
      icon__default_sizeAndColor: {
        WebkitMaskSize: this.props.showIconAtReducedSize ? '10px' : '12px',
        backgroundColor: this.props.tabIconColor === 'white'
          ? color.white100
          : color.mediumGray
      }
    })

    return <TabIcon
      data-test-id={this.testingIcon}
      className={css(
        styles.icon,
        this.props.favicon && iconStyles.icon__favicon,
        !this.props.isPinned && this.props.showIconWithLessMargin && styles.icon_lessMargin,
        !this.props.isPinned && this.props.showIconAtReducedSize && styles.icon_reducedSize
      )}
      symbol={
        this.props.tabLoading
          ? (
            // no loading icon if there's no room for the icon
            !this.props.showIconAtReducedSize &&
            css(styles.icon__loading, iconStyles.icon__loading_color)
          )
          : (
            !this.props.favicon &&
            css(styles.icon__default, iconStyles.icon__default_sizeAndColor)
          )
      } />
  }
}

module.exports = ReduxComponent.connect(Favicon)

const styles = StyleSheet.create({
  icon: {
    opacity: 0,
    willChange: 'opacity',
    animationName: opacityIncreaseKeyframes,
    animationDelay: '50ms',
    animationTimingFunction: 'linear',
    animationDuration: '200ms',
    animationFillMode: 'forwards',

    position: 'relative',
    boxSizing: 'border-box',
    width: spacing.iconSize,
    height: spacing.iconSize,
    backgroundSize: spacing.iconSize,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignSelf: 'center'
  },

  icon_lessMargin: {
    margin: 0
  },

  icon_reducedSize: {
    width: spacing.narrowIconSize,
    height: '-webkit-fill-available',
    alignItems: 'center',
    backgroundSize: spacing.narrowIconSize
  },

  icon__loading: {
    position: 'absolute',
    left: 0,
    willChange: 'transform',
    backgroundImage: `url(${loadingIconSvg})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top left',
    animationName: spinKeyframes,
    animationTimingFunction: 'linear',
    animationDuration: '1200ms',
    animationIterationCount: 'infinite'
  },

  icon__default: {
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskImage: `url(${defaultIconSvg})`
  }
})
