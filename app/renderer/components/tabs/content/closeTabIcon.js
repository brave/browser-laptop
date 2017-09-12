/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State helpers
const tabState = require('../../../../common/state/tabState')
const tabUIState = require('../../../../common/state/tabUIState')
const closeState = require('../../../../common/state/tabContentState/closeState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')
const appActions = require('../../../../../js/actions/appActions')

// Styles
const {theme} = require('../../styles/theme')
const {spacing} = require('../../styles/global')
const {opacityIncreaseKeyframes} = require('../../styles/animations')
const closeTabSvg = require('../../../../extensions/brave/img/tabs/close_btn.svg')

class CloseTabIcon extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
  }

  onClick (event) {
    event.stopPropagation()
    if (this.props.hasFrame) {
      windowActions.onTabClosedWithMouse({
        fixTabWidth: this.props.fixTabWidth
      })
      appActions.tabCloseRequested(this.props.tabId)
    }
  }

  onDragStart (event) {
    event.preventDefault()
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)
    const isPinned = tabState.isTabPinned(state, tabId)

    const props = {}
    props.isPinned = isPinned
    props.fixTabWidth = ownProps.fixTabWidth
    props.hasFrame = frameStateUtil.hasFrame(currentWindow, frameKey)
    props.centralizeTabIcons = tabUIState.centralizeTabIcons(currentWindow, frameKey, isPinned)
    props.showCloseIcon = closeState.showCloseTabIcon(currentWindow, frameKey)
    props.tabId = tabId

    return props
  }

  render () {
    if (this.props.isPinned || !this.props.showCloseIcon) {
      return null
    }

    return <TabIcon
      data-test-id='closeTabIcon'
      data-test2-id={this.props.showCloseIcon ? 'close-icon-on' : 'close-icon-off'}
      className={css(
        styles.closeTab__icon,
        this.props.centralizeTabIcons && styles.closeTab__icon_centered
      )}
      l10nId='closeTabButton'
      onClick={this.onClick}
      onDragStart={this.onDragStart}
      draggable='true'
    />
  }
}

module.exports = ReduxComponent.connect(CloseTabIcon)

const styles = StyleSheet.create({
  closeTab__icon: {
    opacity: 0,
    willChange: 'opacity',
    animationName: opacityIncreaseKeyframes,
    animationTimingFunction: 'linear',
    animationDuration: '100ms',
    animationDelay: '25ms',
    animationFillMode: 'forwards',
    boxSizing: 'border-box',
    backgroundImage: `url(${closeTabSvg})`,
    backgroundSize: spacing.closeIconSize,
    // mask icon to gray to avoid calling another icon on hover
    transition: 'filter 150ms linear',
    filter: theme.tab.content.icon.close.filter,
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    width: spacing.closeIconSize,
    height: spacing.closeIconSize,
    marginRight: spacing.defaultTabMargin,

    ':hover': {
      filter: 'none'
    }
  },

  closeTab__icon_centered: {
    position: 'absolute',
    margin: 'auto',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
})
