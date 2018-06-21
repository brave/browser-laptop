/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')

// State helpers
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabState = require('../../../../common/state/tabState')
const tabUIState = require('../../../../common/state/tabUIState')

// Styles
const globalStyles = require('../../styles/global')
const {opacityIncreaseElementKeyframes} = require('../../styles/animations')
require('../../../../../fonts/poppins.css')

class TorIcon extends React.Component {
  constructor (props) {
    super(props)
    this.setRef = this.setRef.bind(this)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)
    const frame = frameStateUtil.getFrameByKey(currentWindow, frameKey)

    const props = {}
    props.isPinned = tabState.isTabPinned(state, tabId)
    props.showTorIcon = frameStateUtil.isTor(frame) &&
      tabUIState.showTabEndIcon(currentWindow, frameKey)
    props.tabId = tabId

    return props
  }

  componentDidMount (props) {
    this.transitionInIfRequired()
  }

  componentDidUpdate (prevProps) {
    this.transitionInIfRequired(prevProps)
  }

  transitionInIfRequired (prevProps) {
    const shouldTransitionIn = (
      // need to have the element created already
      this.element &&
      // should show the icon
      this.props.showTorIcon &&
      // state has changed
      (!prevProps || !prevProps.showTorIcon)
    )
    if (shouldTransitionIn) {
      this.element.animate(opacityIncreaseElementKeyframes, {
        duration: 120,
        easing: 'ease-out'
      })
    }
  }

  setRef (ref) {
    this.element = ref
  }

  render () {
    if (this.props.isPinned || !this.props.showTorIcon) {
      return null
    }

    return <div
      data-test-id='torIcon'
      className={css(
        styles.icon_private
      )}
      ref={this.setRef}
    >
      Tor
    </div>
  }
}

const styles = StyleSheet.create({
  icon_private: {
    marginRight: globalStyles.spacing.defaultTabMargin,
    paddingTop: '1px',
    font: '600 10px Poppins, sans-serif'
  }
})

module.exports = ReduxComponent.connect(TorIcon)
