/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('./styles/global')

class TabIcon extends ImmutableComponent {
  render () {
    const className = css(
      styles.icon,
      this.props.withBlueIcon && styles.blueIcon
    )
    return <div className={className} onClick={this.props.onClick}>
      <span className={this.props.styles} />
    </div>
  }
}

class AudioTabIcon extends ImmutableComponent {
  render () {
    return <TabIcon withBlueIcon {...this.props} />
  }
}

const styles = StyleSheet.create({
  'icon': {
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'inline-block',
    fontSize: '14px',
    margin: 'auto 7px auto 7px',
    position: 'relative',
    verticalAlign: 'middle',
    textAlign: 'center'
  },
  'blueIcon': {
    color: globalStyles.color.highlightBlue
  }
})

module.exports = {
  TabIcon,
  AudioTabIcon
}
