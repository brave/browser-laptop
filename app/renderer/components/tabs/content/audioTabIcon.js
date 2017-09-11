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
const tabState = require('../../../../common/state/tabState')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')

class AudioTabIcon extends React.Component {
  constructor (props) {
    super(props)
    this.toggleMute = this.toggleMute.bind(this)
  }

  get audioIcon () {
    const isNotMuted = this.props.pageCanPlayAudio && !this.props.audioMuted

    return isNotMuted
      ? globalStyles.appIcons.volumeOn
      : globalStyles.appIcons.volumeOff
  }

  toggleMute (event) {
    event.stopPropagation()
    windowActions.setAudioMuted(this.props.frameKey, this.props.tabId, !this.props.audioMuted)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')

    // AudioIcon will never be created if there is no frameKey, but for consistency
    // across other components I added teh || Immutable.Map()
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey) || Immutable.Map()
    const breakpoint = ownProps.breakpoint

    const props = {}
    // used in other functions
    props.frameKey = ownProps.frameKey
    props.pageCanPlayAudio = !!frame.get('audioPlaybackActive')
    props.tabId = frame.get('tabId', tabState.TAB_ID_NONE)
    props.audioMuted = frame.get('audioMuted')
    props.showAudioIcon = breakpoint === 'default' && !!frame.get('audioPlaybackActive')

    return props
  }

  render () {
    if (!this.props.showAudioIcon) {
      return null
    }
    return <TabIcon
      className={css(styles.icon, styles.icon_audio)}
      symbol={this.audioIcon}
      onClick={this.toggleMute}
    />
  }
}

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

  icon_audio: {
    color: globalStyles.color.highlightBlue,

    // 16px
    fontSize: `calc(${globalStyles.fontSize.tabIcon} + 2px)`,

    // equal spacing around audio icon (favicon and tabTitle)
    padding: globalStyles.spacing.defaultTabPadding,
    paddingRight: '0 !important'
  }
})

module.exports = ReduxComponent.connect(AudioTabIcon)
