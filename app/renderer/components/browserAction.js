/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const electron = require('electron')
const ipc = electron.ipcRenderer
const Button = require('../../../js/components/button')
const BrowserActionBadge = require('../../renderer/components/browserActionBadge')
const extensionState = require('../../common/state/extensionState')
const windowActions = require('../../../js/actions/windowActions')
const {StyleSheet, css} = require('aphrodite')

class BrowserAction extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }

  onClick (e) {
    if (/^chrome-extension/.test(this.props.popupWindowSrc)) {
      windowActions.setPopupWindowDetail()
      return
    }
    let centerX
    let centerY
    if (!e.nativeEvent.x || !e.nativeEvent.y) {
      // Handles case where user focuses button, and presses Enter
      let { top: offsetTop, left: offsetLeft } = e.target.getBoundingClientRect()
      centerX = offsetLeft + (e.target.offsetWidth * 0.5)
      centerY = offsetTop + (e.target.offsetHeight * 0.5)
    }
    let props = {
      x: e.nativeEvent.x || centerX,
      y: e.nativeEvent.y || centerY,
      screenX: e.nativeEvent.screenX,
      screenY: e.nativeEvent.screenY,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY
    }
    ipc.send('chrome-browser-action-clicked', this.props.extensionId, this.props.tabId, this.props.browserAction.get('title'), props)
  }

  render () {
    const browserBadgeText = this.props.browserAction.get('text')
    const browserBadgeColor = this.props.browserAction.get('color')
    // TODO(bridiver) should have some visual notification of hover/press
    return <div className={css(styles.browserActionButton)}>
      <Button iconClass='extensionBrowserAction'
        className={css(styles.extensionButton)}
        inlineStyles={{
          backgroundImage: extensionState.browserActionBackgroundImage(this.props.browserAction, this.props.tabId)
        }}
        dataButtonValue={this.props.extensionId}
        onClick={this.onClick} />
      { browserBadgeText
        ? <BrowserActionBadge text={browserBadgeText} color={browserBadgeColor} />
        : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  browserActionButton: {
    position: 'relative'
  },
  extensionButton: {
    '-webkit-app-region': 'no-drag',
    backgroundSize: 'contain',
    height: '17px',
    margin: '4px 0 0 0',
    opacity: '0.85',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  }
})

module.exports = BrowserAction
