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
const partitionState = require('../../../../common/state/tabContentState/partitionState')
const tabUIState = require('../../../../common/state/tabUIState')
const tabState = require('../../../../common/state/tabState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')
const {opacityIncreaseElementKeyframes} = require('../../styles/animations')
const newSessionSvg = require('../../../../extensions/brave/img/tabs/new_session.svg')

class NewSessionIcon extends React.Component {
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
    props.showPartitionIcon = partitionState.showPartitionIcon(currentWindow, frameKey)
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, frameKey)
    props.textIsWhite = tabUIState.checkIfTextColor(currentWindow, frameKey, 'white')
    props.partitionNumber = partitionState.getMaxAllowedPartitionNumber(currentWindow, frameKey)
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
      // no icon is showing if pinned tab
      !this.props.isPinned &&
      // make sure icon should show
      this.props.showPartitionIcon && this.props.partitionNumber !== 0 &&
      // only if the icon showing is a new state
      // check the previous state to see if it was not showing
      (!prevProps || !prevProps.showPartitionIcon || prevProps.partitionNumber === 0)
    )
    if (prevProps) {
      console.log({shouldTransitionIn, prevProps, props: this.props, element: this.element})
    }
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
    if (
      this.props.isPinned ||
      !this.props.showPartitionIcon ||
      this.props.partitionNumber === 0
    ) {
      return null
    }

    const newSessionProps = StyleSheet.create({
      newSession__indicator: {
        filter: this.props.isActive && this.props.textIsWhite
          ? 'invert(100%)'
          : 'none'
      }
    })

    return <TabIcon symbol
      data-test-id='newSessionIcon'
      className={css(styles.newSession__icon, newSessionProps.newSession__indicator)}
      symbolContent={this.props.partitionNumber}
      l10nArgs={{partitionNumber: this.props.partitionNumber}}
      l10nId='sessionInfoTab'
      ref={this.setRef}
    />
  }
}

module.exports = ReduxComponent.connect(NewSessionIcon)

const styles = StyleSheet.create({
  newSession__icon: {
    willChange: 'opacity',
    zIndex: globalStyles.zindex.zindexTabsThumbnail,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    backgroundImage: `url(${newSessionSvg})`,
    backgroundPosition: 'center left',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '13px',
    width: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize,
    marginRight: globalStyles.spacing.defaultTabMargin
  }
})
