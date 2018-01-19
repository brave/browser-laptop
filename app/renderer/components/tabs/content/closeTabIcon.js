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
const tabState = require('../../../../common/state/tabState')
const tabUIState = require('../../../../common/state/tabUIState')
const closeState = require('../../../../common/state/tabContentState/closeState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')
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
        duration: 120,
        easing: 'ease-out'
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
      className={[
        styles.icon_close,
        this.props.centralizeTabIcons && styles.icon_close_centered
      ]}
      l10nId='closeTabButton'
      onClick={this.props.onClick}
      onDragStart={this.onDragStart}
      draggable='true'
      ref={this.setRef}
    />
  }
}

const styles = StyleSheet.create({
  icon_close: {
    marginRight: globalStyles.spacing.defaultTabMargin,
    backgroundImage: `url(${closeTabSvg})`,

    // Override default properties
    backgroundSize: globalStyles.spacing.closeIconSize,
    width: globalStyles.spacing.closeIconSize,
    height: globalStyles.spacing.closeIconSize,

    // mask icon to gray to avoid calling another icon on hover
    transition: 'filter 120ms ease',
    filter: theme.tab.icon.close.filter,

    ':hover': {
      filter: 'none'
    }
  },

  icon_close_centered: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    margin: 'auto'
  }
})

module.exports = ReduxComponent.connect(CloseTabIcon)
