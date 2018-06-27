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
const {theme} = require('../../styles/theme')
require('../../../../../fonts/poppins.css')

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
    if (
      this.props.isPinned ||
      !this.props.showPartitionIcon ||
      this.props.partitionNumber === 0
    ) {
      return null
    }

    const sessionName = <div className={css(styles.icon_newSession__name)}>
      { this.props.partitionNumber }
    </div>

    return <TabIcon
      data-test-id='newSessionIcon'
      className={[
        styles.icon_newSession,
        this.props.isActive && this.props.textIsWhite && styles.icon_newSession_active_light
      ]}
      symbolContent={sessionName}
      symbol={css(styles.icon__symbol)}
      l10nArgs={{partitionNumber: this.props.partitionNumber}}
      l10nId='sessionInfoTab'
      ref={this.setRef}
    />
  }
}

const styles = StyleSheet.create({
  icon_newSession: {
    backgroundImage: `url(${newSessionSvg})`,
    backgroundPosition: 'center left',
    marginRight: globalStyles.spacing.defaultTabMargin,

    // Override default properties
    backgroundSize: globalStyles.spacing.newSessionIconSize
  },

  icon_newSession_active_light: {
    filter: 'invert(100%)'
  },

  icon__symbol: {
    marginLeft: '4px',
    justifyContent: 'flex-end'
  },

  icon_newSession__name: {
    marginLeft: '6px',
    font: '600 9px/0 Poppins, sans-serif',
    color: theme.tab.icon.symbol.color
  }
})

module.exports = ReduxComponent.connect(NewSessionIcon)
