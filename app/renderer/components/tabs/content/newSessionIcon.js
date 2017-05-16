/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const TabIcon = require('./tabIcon')

// Utils
const {hasVisibleSecondaryIcon, getTabIconColor} = require('../../../lib/tabUtil')

// Constants
const {tabs} = require('../../../../../js/constants/config')

// Styles
const tabStyles = require('../../styles/tab')
const newSessionSvg = require('../../../../extensions/brave/img/tabs/new_session.svg')

class NewSessionIcon extends ImmutableComponent {
  get partitionNumber () {
    let partition = this.props.frame.get('partitionNumber')
    // Persistent partitions opened by `target="_blank"` will have
    // *partition-* string first, which causes bad UI. We don't need it for tabs
    if (typeof partition === 'string') {
      partition = partition.replace(/^partition-/i, '')
    }
    return partition
  }

  get partitionIndicator () {
    // For now due to UI limitations set session up to 9 visually
    return this.partitionNumber > tabs.maxAllowedNewSessions
      ? tabs.maxAllowedNewSessions
      : this.partitionNumber
  }

  get iconColor () {
    return getTabIconColor(this.props)
  }

  render () {
    const newSession = StyleSheet.create({
      indicator: {
        // Based on getTextColorForBackground() icons can be only black or white.
        filter: this.props.isActive && this.iconColor === 'white' ? 'invert(100%)' : 'none'
      }
    })

    return this.partitionNumber && hasVisibleSecondaryIcon(this.props)
      ? <TabIcon symbol
        data-test-id='newSessionIcon'
        className={css(tabStyles.icon, styles.newSession, newSession.indicator)}
        symbolContent={this.partitionIndicator}
        {...this.props}
      />
      : null
  }
}

module.exports = NewSessionIcon

const styles = StyleSheet.create({
  newSession: {
    position: 'relative',
    backgroundImage: `url(${newSessionSvg})`,
    backgroundPosition: 'left'
  }
})
