/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State
const tabContentState = require('../../../../common/state/tabContentState')

// Constants
const {tabs} = require('../../../../../js/constants/config')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const tabStyles = require('../../styles/tab')
const newSessionSvg = require('../../../../extensions/brave/img/tabs/new_session.svg')

class NewSessionIcon extends React.Component {
  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey)
    const partition = frame.get('partitionNumber')

    const props = {}
    // used in renderer
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, ownProps.frameKey)
    props.iconColor = tabContentState.getTabIconColor(currentWindow, ownProps.frameKey)
    props.partitionNumber = typeof partition === 'string'
      ? partition.replace(/^partition-/i, '')
      : partition
    props.partitionIndicator = props.partitionNumber > tabs.maxAllowedNewSessions
      ? tabs.maxAllowedNewSessions
      : props.partitionNumber

    // used in funtions
    props.frameKey = ownProps.frameKey

    return props
  }

  render () {
    const newSession = StyleSheet.create({
      indicator: {
        // Based on getTextColorForBackground() icons can be only black or white.
        filter: this.props.isActive && this.props.iconColor === 'white' ? 'invert(100%)' : 'none'
      }
    })

    return <TabIcon symbol
      data-test-id='newSessionIcon'
      className={css(tabStyles.icon, styles.newSession, newSession.indicator)}
      symbolContent={this.props.partitionIndicator}
      l10nArgs={this.props.partitionNumber}
      l10nId='sessionInfoTab'
    />
  }
}

module.exports = ReduxComponent.connect(NewSessionIcon)

const styles = StyleSheet.create({
  newSession: {
    position: 'relative',
    backgroundImage: `url(${newSessionSvg})`,
    backgroundPosition: 'left'
  }
})
