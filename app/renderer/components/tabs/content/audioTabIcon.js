/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet} = require('aphrodite/no-important')
const locale = require('../../../../../js/l10n')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State helpers
const audioState = require('../../../../common/state/tabContentState/audioState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabState = require('../../../../common/state/tabState')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Styles
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')
const {widthIncreaseElementKeyframes} = require('../../styles/animations')

class AudioTabIcon extends React.Component {
  constructor (props) {
    super(props)
    this.toggleMute = this.toggleMute.bind(this)
    this.setRef = this.setRef.bind(this)
  }

  get audioIcon () {
    return this.props.audioPlaying
      ? globalStyles.appIcons.volumeOn
      : globalStyles.appIcons.volumeOff
  }

  toggleMute (event) {
    event.stopPropagation()
    windowActions
      .setAudioMuted(this.props.frameKey, this.props.tabId, this.props.audioPlaying)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)

    const props = {}
    props.frameKey = frameKey
    props.showAudioIcon = audioState.showAudioIcon(currentWindow, frameKey)
    props.audioPlaying = !audioState.isAudioMuted(currentWindow, frameKey)
    props.canPlayAudio = audioState.canPlayAudio(currentWindow, frameKey)
    props.isPinned = tabState.isTabPinned(state, tabId)
    props.tabId = tabId

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
      // audio is stopped), then we should use https://github.com/reactjs/react-transition-group
      // For now, we'll just not do anything since we can't - the element
      // will have already been removed
      this.props.showAudioIcon &&
      // state has changed
      (!prevProps || this.props.showAudioIcon !== prevProps.showAudioIcon)
    )
    if (shouldTransitionIn) {
      // TODO: measure element width if this ever becomes dynamic since
      // it's not great to specify complex size logic in two places
      // or animate a child element using transform: translateX
      // in order to achieve the slide-in
      const transitionKeyframes = widthIncreaseElementKeyframes(0, globalStyles.spacing.iconSize)
      this.element.animate(transitionKeyframes, {
        duration: 100,
        easing: 'linear'
      })
    }
  }

  setRef (ref) {
    this.element = ReactDOM.findDOMNode(ref)
  }

  render () {
    if (this.props.isPinned || !this.props.showAudioIcon) {
      return null
    }

    return <TabIcon
      data-test-id={this.audioIcon}
      className={styles.icon_audio}
      symbol={this.audioIcon}
      onClick={this.toggleMute}
      title={locale.translation(this.props.audioPlaying ? 'muteTab' : 'unmuteTab')}
      ref={this.setRef}
    />
  }
}

const styles = StyleSheet.create({
  icon_audio: {
    overflow: 'hidden',
    margin: '1px -2px 0 2px', // get centered with funky font awesome sizing
    color: theme.tab.icon.audio.color,
    fontSize: '14px',
    ':hover': {
      color: theme.tab.icon.audio.hoverColor
    }
  }
})

module.exports = ReduxComponent.connect(AudioTabIcon)
