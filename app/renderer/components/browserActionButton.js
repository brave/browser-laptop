/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const electron = global.require('electron')
const ipc = electron.ipcRenderer
const Button = require('../../../js/components/button')
const cx = require('../../../js/lib/classSet.js')
const extensionState = require('../../common/state/extensionState')
const windowActions = require('../../../js/actions/windowActions')

class BrowserActionButton extends ImmutableComponent {
  onClicked (id, title, e) {
    if (/^chrome-extension/.test(this.props.popupWindowSrc)) {
      windowActions.setPopupWindowDetail()
      return
    }
    let props = {
      x: e.nativeEvent.x,
      y: e.nativeEvent.y,
      screenX: e.nativeEvent.screenX,
      screenY: e.nativeEvent.screenY,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY
    }
    ipc.send('chrome-browser-action-clicked', id, this.props.tabId, title, props)
  }

  render () {
    // TODO(bridiver) should have some visual notification of hover/press
    return <Button iconClass='extensionBrowserAction'
      className={cx({
        extensionButton: true
      })}
      inlineStyles={{
        backgroundImage: extensionState.browserActionBackgroundImage(this.props.browserAction),
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
      dataButtonValue={this.props.extensionId}
      onClick={this.onClicked.bind(this, this.props.extensionId, this.props.browserAction.get('title'))} />
  }
}

module.exports = BrowserActionButton
