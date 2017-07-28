/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer

// Components
const ReduxComponent = require('../../reduxComponent')
const LongPressButton = require('../../common/longPressButton')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Constants
const messages = require('../../../../../js/constants/messages')

// State
const tabState = require('../../../../common/state/tabState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Utils
const eventUtil = require('../../../../../js/lib/eventUtil')
const contextMenus = require('../../../../../js/contextMenus')

const {StyleSheet} = require('aphrodite/no-important')

const reloadButtonIcon = require('../../../../../img/toolbar/reload_btn.svg')

class ReloadButton extends React.Component {
  constructor (props) {
    super(props)
    this.onReload = this.onReload.bind(this)
    this.onReloadLongPress = this.onReloadLongPress.bind(this)
  }

  onReload (e) {
    if (eventUtil.isForSecondaryAction(e)) {
      appActions.tabCloned(this.props.activeTabId, {active: !!e.shiftKey})
    } else {
      ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
    }
  }

  onReloadLongPress (target) {
    contextMenus.onReloadContextMenu(target)
  }

  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)

    const props = {}

    props.activeTabId = activeTabId

    return props
  }

  render () {
    // BEM Level: navigationBar__buttonContainer
    return <LongPressButton
      navigationButton
      custom={styles.navigationButton_reload}
      l10nId='reloadButton'
      testId='reloadButton'
      onClick={this.onReload}
      onLongPress={this.onReloadLongPress}
    />
  }
}

const styles = StyleSheet.create({
  navigationButton_reload: {
    background: `url(${reloadButtonIcon}) center no-repeat`,
    backgroundSize: '13px 13px'
  }
})

module.exports = ReduxComponent.connect(ReloadButton)
