const appActions = require('../../js/actions/appActions')
const tabMessageBoxState = require('../common/state/tabMessageBoxState')
const {makeImmutable} = require('../common/state/immutableUtil')

// callbacks for alert, confirm, etc.
let messageBoxCallbacks = {}

const cleanupCallback = (tabId) => {
  if (messageBoxCallbacks[tabId]) {
    delete messageBoxCallbacks[tabId]
    return true
  }
  return false
}

const tabMessageBox = {
  init: (state, action) => {
    process.on('window-alert', (webContents, extraData, title, message, defaultPromptText,
      shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, cb) => {
      const tabId = webContents.getId()
      const detail = {
        message,
        title,
        buttons: ['OK'],
        suppress: false,
        showSuppress: shouldDisplaySuppressCheckbox
      }

      tabMessageBox.show(webContents, tabId, detail, cb)
    })

    process.on('window-confirm', (webContents, extraData, title, message, defaultPromptText,
        shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, cb) => {
      const tabId = webContents.getId()
      const detail = {
        message,
        title,
        buttons: ['OK', 'Cancel'],
        cancelId: 1,
        suppress: false,
        showSuppress: shouldDisplaySuppressCheckbox
      }

      tabMessageBox.show(webContents, tabId, detail, cb)
    })

    process.on('window-prompt', (webContents, extraData, title, message, defaultPromptText,
          shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, cb) => {
      console.warn('window.prompt is not supported yet')
      let suppress = false
      cb(false, '', suppress)
    })

    return state
  },

  show: (webContents, tabId, detail, cb) => {
    messageBoxCallbacks[tabId] = cb

    webContents.on('destroyed', () => {
      // default to false / '' / false when closed
      if (cleanupCallback(tabId)) {
        cb(false, '', false)
      }
    })

    webContents.on('crashed', () => {
      // default to false / '' / false for a crash
      if (cleanupCallback(tabId)) {
        cb(false, '', false)
      }
    })

    setImmediate(() => {
      appActions.tabMessageBoxShown(tabId, detail)
    })
  },

  close: (state, action) => {
    action = makeImmutable(action)
    let tabId = action.get('tabId')
    let detail = action.get('detail')
    let cb = messageBoxCallbacks[tabId]
    let suppress = false
    let result = true
    state = tabMessageBoxState.removeDetail(state, action)
    if (cb) {
      cleanupCallback(tabId)
      if (detail) {
        if (detail.has('suppress')) {
          suppress = detail.get('suppress')
        }
        if (detail.has('result')) {
          result = detail.get('result')
        }
        cb(result, '', suppress)
      } else {
        cb(false, '', false)
      }
    }
    return state
  },

  getCallbacks: () => {
    return messageBoxCallbacks
  }
}

module.exports = tabMessageBox
