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
      className={css(styles.icon, styles.secondaryIcon, privateStyles.icon)}
    />
  }
}

module.exports = ReduxComponent.connect(PrivateIcon)

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

  secondaryIcon: {
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskImage: `url(${privateSvg})`
  }
})
