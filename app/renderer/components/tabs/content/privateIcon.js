/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const TabIcon = require('./tabIcon')

// Utils
const {hasVisibleSecondaryIcon} = require('../../../lib/tabUtil')

// Styles
const globalStyles = require('../../styles/global')
const tabStyles = require('../../styles/tab')
const privateSvg = require('../../../../extensions/brave/img/tabs/private.svg')

class PrivateIcon extends ImmutableComponent {
  render () {
    const privateStyles = StyleSheet.create({
      icon: {
        backgroundColor: this.props.isActive ? globalStyles.color.white100 : globalStyles.color.black100
      }
    })

    return this.props.tab.get('isPrivate') && hasVisibleSecondaryIcon(this.props)
      ? <TabIcon data-test-id='privateIcon'
        className={css(tabStyles.icon, styles.secondaryIcon, privateStyles.icon)}
      />
      : null
  }
}

module.exports = PrivateIcon

const styles = StyleSheet.create({
  secondaryIcon: {
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskImage: `url(${privateSvg})`
  }
})
