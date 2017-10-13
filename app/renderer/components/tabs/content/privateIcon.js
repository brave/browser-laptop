/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State helpers
const privateState = require('../../../../common/state/tabContentState/privateState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabState = require('../../../../common/state/tabState')

// Styles
const {theme} = require('../../styles/theme')
const globalStyles = require('../../styles/global')
const {opacityIncreaseElementKeyframes} = require('../../styles/animations')
const privateSvg = require('../../../../extensions/brave/img/tabs/private.svg')

class PrivateIcon extends React.Component {
  constructor (props) {
    super(props)
    this.setRef = this.setRef.bind(this)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)

    const props = {}
    props.isPinned = tabState.isTabPinned(state, tabId)
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, frameKey)
    props.showPrivateIcon = privateState.showPrivateIcon(currentWindow, frameKey)
    props.tabId = tabId

    return props
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
      // should show the icon
      this.props.showPrivateIcon &&
      // state has changed
      (!prevProps || !prevProps.showPrivateIcon)
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
    if (this.props.isPinned || !this.props.showPrivateIcon) {
      return null
    }

    const privateProps = StyleSheet.create({
      private__icon_color: {
        backgroundColor: this.props.isActive
          ? theme.tab.content.icon.private.background.active
          : theme.tab.content.icon.private.background.notActive
      }
    })

    return <TabIcon
      data-test-id='privateIcon'
      className={css(styles.private__icon, privateProps.private__icon_color)}
      ref={this.setRef}
    />
  }
}

module.exports = ReduxComponent.connect(PrivateIcon)

const styles = StyleSheet.create({
  private__icon: {
    willChange: 'opacity',
    zIndex: globalStyles.zindex.zindexTabsThumbnail,
    boxSizing: 'border-box',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskImage: `url(${privateSvg})`,
    WebkitMaskSize: globalStyles.spacing.sessionIconSize,
    width: globalStyles.spacing.sessionIconSize,
    height: globalStyles.spacing.sessionIconSize,
    marginRight: globalStyles.spacing.defaultTabMargin
  }
})
