/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')
const tabStyles = require('../../styles/tab')
const privateSvg = require('../../../../extensions/brave/img/tabs/private.svg')

class PrivateIcon extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frameKey = ownProps.frameKey

    const props = {}
    // used in renderer
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, frameKey)

    // used in functions
    props.frameKey = frameKey

    return props
  }

  render () {
    const privateStyles = StyleSheet.create({
      icon: {
        backgroundColor: this.props.isActive ? globalStyles.color.white100 : globalStyles.color.black100
      }
    })

    return <TabIcon
      data-test-id='privateIcon'
      className={css(tabStyles.icon, styles.secondaryIcon, privateStyles.icon)}
    />
  }
}

module.exports = ReduxComponent.connect(PrivateIcon)

const styles = StyleSheet.create({
  secondaryIcon: {
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskImage: `url(${privateSvg})`
  }
})
