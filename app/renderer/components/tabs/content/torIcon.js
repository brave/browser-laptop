/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State helpers
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabState = require('../../../../common/state/tabState')
const privateState = require('../../../../common/state/tabContentState/privateState')

// Styles
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')
const {opacityIncreaseElementKeyframes} = require('../../styles/animations')

const torSvg = require('../../../../extensions/brave/img/tabs/tor.svg')

class TorIcon extends React.Component {
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
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, frameKey)
    props.showTorIcon = frameStateUtil.isTor(frame) &&
      privateState.showPrivateIcon(currentWindow, frameKey)
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
      this.props.showTorIcon &&
      // state has changed
      (!prevProps || !prevProps.showTorIcon)
    )
    if (shouldTransitionIn) {
      this.element.animate(opacityIncreaseElementKeyframes, {
        duration: 120,
        easing: 'ease-out'
      })
    }
  }

  setRef (ref) {
    this.element = ReactDOM.findDOMNode(ref)
  }

  render () {
    if (this.props.isPinned || !this.props.showTorIcon) {
      return null
    }

    return <TabIcon
      data-test-id='torIcon'
      className={[
        styles.icon_private,
        this.props.isActive && styles.icon_private_active
      ]}
      ref={this.setRef}
    />
  }
}

const styles = StyleSheet.create({
  icon_private: {
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskImage: `url(${torSvg})`,
    WebkitMaskSize: globalStyles.spacing.sessionIconSize,
    marginRight: globalStyles.spacing.defaultTabMargin,

    // Override default properties
    backgroundSize: 0,
    height: globalStyles.spacing.sessionIconSize,
    width: globalStyles.spacing.sessionIconSize,
    backgroundColor: theme.tab.icon.private.background.notActive
  },

  icon_private_active: {
    backgroundColor: theme.tab.icon.private.background.active
  }
})

module.exports = ReduxComponent.connect(TorIcon)
