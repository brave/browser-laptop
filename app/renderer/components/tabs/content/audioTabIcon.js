/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const TabIcon = require('./tabIcon')

// Styles
const globalStyles = require('../../styles/global')
const tabStyles = require('../../styles/tab')

class AudioTabIcon extends ImmutableComponent {
  get pageCanPlayAudio () {
    return !!this.props.frame.get('audioPlaybackActive')
  }

  get shouldShowAudioIcon () {
    // We switch to blue top bar for all breakpoints but default
    return this.props.frame.get('breakpoint') === 'default'
  }

  get mutedState () {
    return this.pageCanPlayAudio && !!this.props.frame.get('audioMuted')
  }

  get audioIcon () {
    return !this.mutedState
      ? globalStyles.appIcons.volumeOn
      : globalStyles.appIcons.volumeOff
  }

  render () {
    return this.pageCanPlayAudio && this.shouldShowAudioIcon
      ? <TabIcon
        className={css(tabStyles.icon, styles.audioIcon)}
        symbol={this.audioIcon}
        onClick={this.props.onClick} />
      : null
  }
}

module.exports = AudioTabIcon

const styles = StyleSheet.create({
  audioIcon: {
    color: globalStyles.color.highlightBlue,
    fontSize: '16px'
  }
})
