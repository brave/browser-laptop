/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State
const tabUIState = require('../../../../common/state/tabUIState')

// Constants
const {tabs} = require('../../../../../js/constants/config')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')
const newSessionSvg = require('../../../../extensions/brave/img/tabs/new_session.svg')

class NewSessionIcon extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frameKey = ownProps.frameKey
    const frame = frameStateUtil.getFrameByKey(currentWindow, frameKey) || Immutable.Map()
    const partition = frame.get('partitionNumber')
    const hasSeconardImage = tabUIState.hasVisibleSecondaryIcon(currentWindow, ownProps.frameKey)

    const props = {}
    // used in renderer
    props.showSessionIcon = !!partition && hasSeconardImage
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, frameKey)
    props.iconColor = tabUIState.getTabIconColor(currentWindow, frameKey)
    props.partitionNumber = typeof partition === 'string'
      ? partition.replace(/^partition-/i, '')
      : partition
    props.partitionIndicator = props.partitionNumber > tabs.maxAllowedNewSessions
      ? tabs.maxAllowedNewSessions
      : props.partitionNumber

    // used in functions
    props.frameKey = frameKey

    return props
  }

  render () {
    if (!this.props.showSessionIcon) {
      return null
    }
    const newSession = StyleSheet.create({
      indicator: {
        // Based on getTextColorForBackground() icons can be only black or white.
        filter: this.props.isActive && this.props.iconColor === 'white' ? 'invert(100%)' : 'none'
      }
    })

    return <TabIcon symbol
      data-test-id='newSessionIcon'
      className={css(styles.icon, styles.newSession, newSession.indicator)}
      symbolContent={this.props.partitionIndicator}
      l10nArgs={this.props.partitionNumber}
      l10nId='sessionInfoTab'
    />
  }
}

module.exports = ReduxComponent.connect(NewSessionIcon)

const styles = StyleSheet.create({
  icon: {
    width: globalStyles.spacing.iconSize,
    minWidth: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize,
    backgroundSize: globalStyles.spacing.iconSize,
    fontSize: globalStyles.fontSize.tabIcon,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    paddingLeft: globalStyles.spacing.defaultIconPadding,
    paddingRight: globalStyles.spacing.defaultIconPadding
  },

  newSession: {
    position: 'relative',
    backgroundImage: `url(${newSessionSvg})`,
    backgroundPosition: 'left'
  }
})
