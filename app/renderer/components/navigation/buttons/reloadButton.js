/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer

// Components
const ImmutableComponent = require('../../immutableComponent')
const NavigationButton = require('./navigationButton')
const ReloadIcon = require('../../../../../icons/refresh')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Constants
const messages = require('../../../../../js/constants/messages')

// Utils
const contextMenus = require('../../../../../js/contextMenus')
const eventUtil = require('../../../../../js/lib/eventUtil')

class ReloadButton extends ImmutableComponent {
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

  render () {
    return <NavigationButton
      l10nId='reloadButton'
      testId='reloadButton'
      onClick={this.onReload}
      onLongPress={this.onReloadLongPress}>
      <ReloadIcon />
    </NavigationButton>
  }
}

module.exports = ReloadButton
