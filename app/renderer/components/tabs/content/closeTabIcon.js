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
const tabState = require('../../../../common/state/tabState')
const tabUIState = require('../../../../common/state/tabUIState')
const closeState = require('../../../../common/state/tabContentState/closeState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const {theme} = require('../../styles/theme')
const {spacing, zindex} = require('../../styles/global')
const {opacityIncreaseElementKeyframes} = require('../../styles/animations')
const closeTabSvg = require('../../../../extensions/brave/img/tabs/close_btn.svg')

class CloseTabIcon extends React.Component {
  constructor (props) {
    super(props)
    this.onDragStart = this.onDragStart.bind(this)
    this.setRef = this.setRef.bind(this)
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
    props.onClick = ownProps.onClick
    props.hasFrame = frameStateUtil.hasFrame(currentWindow, frameKey)
    props.centralizeTabIcons = tabUIState.centralizeTabIcons(currentWindow, frameKey, isPinned)
    props.showCloseIcon = closeState.showCloseTabIcon(currentWindow, frameKey)
    return props
  }

  componentDidMount (props) {
    this.transitionIfRequired()
  }

  componentDidUpdate (prevProps) {
    this.transitionIfRequired(prevProps)
  }

  transitionIfRequired (prevProps) {
    const shouldTransitionIn = (
      // need to have the element created already
      this.element &&
      // no icon is showing if pinned tab
      !this.props.isPinned &&
      // should show the icon
      // TODO: if we want to animate the unmounting of the component (when
      // tab is unhovered), then we should use https://github.com/reactjs/react-transition-group
      // For now, we'll just not do anything since we can't - the element
      // will have already been removed
      this.props.showCloseIcon &&
      // state has changed
      (!prevProps || this.props.showCloseIcon !== prevProps.showCloseIcon)
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
      onClick={this.props.onClick}
      onDragStart={this.onDragStart}
      draggable='true'
      ref={this.setRef}
    />
  }
}

module.exports = ReduxComponent.connect(CloseTabIcon)

const styles = StyleSheet.create({
  closeTab__icon: {
    willChange: 'opacity',

    boxSizing: 'border-box',
    zIndex: zindex.zindexTabsThumbnail,
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
