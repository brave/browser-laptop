/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const electron = require('electron')
const ipc = electron.ipcRenderer
const {StyleSheet, css} = require('aphrodite')

// Components
const ReduxComponent = require('./reduxComponent')
const BrowserButton = require('./common/browserButton')
const BrowserActionBadge = require('../../renderer/components/browserActionBadge')

// State
const extensionState = require('../../common/state/extensionState')
const tabState = require('../../common/state/tabState')

// Actions
const windowActions = require('../../../js/actions/windowActions')

// Utils
const {getCurrentWindowId} = require('../currentWindow')

class BrowserAction extends React.Component {
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
    ipc.send('chrome-browser-action-clicked', this.props.extensionId, this.props.activeTabId, this.props.title, props)
  }

  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeTab = tabState.getActiveTabValue(state, getCurrentWindowId())
    const activeTabId = activeTab && activeTab.get('tabId')
    const browserActions = extensionState.getBrowserActionByTabId(state, ownProps.extensionId, activeTabId)

    const props = {}
    // used in renderer
    props.title = browserActions.get('title')
    props.text = browserActions.get('text')
    props.color = browserActions.get('color')
    props.image = extensionState.browserActionBackgroundImage(browserActions, activeTabId)

    // used in other functions
    props.popupWindowSrc = currentWindow.getIn(['popupWindowDetail', 'src'])
    props.activeTabId = activeTabId

    return Object.assign({}, ownProps, props)
  }

  render () {
    // TODO(bridiver) should have some visual notification of hover/press
    return <div className={css(styles.browserActionButton)}>
      <BrowserButton
        extensionItem
        l10nId='browserActionButton'
        testId='extensionBrowserAction'
        l10nArgs={{ name: this.props.title }}
        inlineStyles={{
          backgroundImage: this.props.image,
          backgroundPosition: 'center',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }}
        dataButtonValue={this.props.extensionId}
        onClick={this.onClick}
      />
      {
        this.props.text
        ? <BrowserActionBadge text={this.props.text} color={this.props.color} />
        : null
      }
    </div>
  }
}

module.exports = ReduxComponent.connect(BrowserAction)

const styles = StyleSheet.create({
  browserActionButton: {
    position: 'relative'
  }
})
