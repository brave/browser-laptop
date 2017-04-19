/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// Store
const windowStore = require('../../../../../js/stores/windowStore')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')
const appActions = require('../../../../../js/actions/appActions')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')
const closeTabHoverSvg = require('../../../../extensions/brave/img/tabs/close_btn_hover.svg')
const closeTabSvg = require('../../../../extensions/brave/img/tabs/close_btn_normal.svg')

class CloseTabIcon extends React.Component {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }
  get frame () {
    return windowStore.getFrame(this.props.frameKey)
  }

  onClick (event) {
    event.stopPropagation()
    const frame = this.frame
    if (frame && !frame.isEmpty()) {
      windowActions.onTabClosedWithMouse({
        fixTabWidth: this.props.fixTabWidth
      })
      appActions.tabCloseRequested(this.props.tabId)
    }
  }

  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const isPinnedTab = frameStateUtil.isPinned(currentWindow, ownProps.frameKey)
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey)

    const props = {}
    // used in renderer
    props.showCloseIcon = !isPinnedTab &&
      (
        frameStateUtil.hasRelativeCloseIcon(currentWindow, ownProps.frameKey) ||
        frameStateUtil.hasFixedCloseIcon(currentWindow, ownProps.frameKey)
      )

    // used in functions
    props.frameKey = ownProps.frameKey
    props.fixTabWidth = ownProps.fixTabWidth
    props.tabId = frame.get('tabId')
    return props
  }

  render () {
    return <TabIcon
      data-test-id='closeTabIcon'
      data-test2-id={this.props.showCloseIcon ? 'close-icon-on' : 'close-icon-off'}
      className={css(this.props.showCloseIcon && styles.closeTab)}
      l10nId='closeTabButton'
      onClick={this.onClick}
    />
  }
}

module.exports = ReduxComponent.connect(CloseTabIcon)

const styles = StyleSheet.create({
  closeTab: {
    position: 'relative',
    paddingLeft: globalStyles.spacing.defaultIconPadding,
    paddingRight: globalStyles.spacing.defaultIconPadding,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: globalStyles.spacing.closeIconSize,
    width: globalStyles.spacing.closeIconSize,
    height: globalStyles.spacing.closeIconSize,
    border: '0',
    zIndex: globalStyles.zindex.zindexTabs,
    backgroundImage: `url(${closeTabSvg})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: globalStyles.spacing.closeIconSize,
    backgroundPosition: 'center center',

    ':hover': {
      backgroundImage: `url(${closeTabHoverSvg})`
    }
  }
})
