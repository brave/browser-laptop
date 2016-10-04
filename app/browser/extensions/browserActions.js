const extensionActions = require('../../common/actions/extensionActions')
const {makeImmutable} = require('../../common/state/immutableUtil')
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const messages = require('../../../js/constants/messages')

const browserActions = {
  init: () => {
    // TODO - clear tab ids when tab is closed
    process.on('chrome-browser-action-registered', (extensionId, details) => {
      extensionActions.browserActionRegistered(extensionId, makeImmutable(details))
    })

    process.on('chrome-browser-action-set-icon', (extensionId, details) => {
      extensionActions.browserActionUpdated(extensionId, makeImmutable(details), details.tabId)
    })

    process.on('chrome-browser-action-set-badge-text', (extensionId, details) => {
      extensionActions.browserActionUpdated(extensionId, makeImmutable(details), details.tabId)
    })

    process.on('chrome-browser-action-set-badge-background-color', (extensionId, details) => {
      extensionActions.browserActionUpdated(extensionId, makeImmutable(details), details.tabId)
    })

    process.on('chrome-browser-action-set-title', (extensionId, details) => {
      extensionActions.browserActionUpdated(extensionId, makeImmutable(details), details.tabId)
    })

    process.on('chrome-browser-action-popup', (extensionId, tabId, name, popup, props) => {
      let nodeProps = {
        left: props.x,
        top: props.y + 20,
        src: popup
      }

      let win = BrowserWindow.getFocusedWindow()
      if (!win) {
        return
      }

      win.webContents.send(messages.NEW_POPUP_WINDOW, extensionId, popup, nodeProps)
    })
  }
}

module.exports = browserActions
