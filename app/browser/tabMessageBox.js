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
        buttons: ['ok'],
        suppress: false,
        showSuppress: shouldDisplaySuppressCheckbox
      }

      tabMessageBox.show(tabId, detail, cb)
    })

    process.on('window-confirm', (webContents, extraData, title, message, defaultPromptText,
        shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, cb) => {
      const tabId = webContents.getId()
      const detail = {
        message,
        title,
        buttons: ['ok', 'cancel'],
        cancelId: 1,
        suppress: false,
        showSuppress: shouldDisplaySuppressCheckbox
      }

      tabMessageBox.show(tabId, detail, cb)
    })

    process.on('window-prompt', (webContents, extraData, title, message, defaultPromptText,
          shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, cb) => {
      console.warn('window.prompt is not supported yet')
      let suppress = false
      cb(false, '', suppress)
    })

    return state
  },

  show: (tabId, detail, cb) => {
    if (cb) {
      messageBoxCallbacks[tabId] = cb
    }
    setImmediate(() => {
      appActions.tabMessageBoxShown(tabId, detail)
    })
  },

  close: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    const detail = action.get('detail')
    const cb = messageBoxCallbacks[tabId]
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

  onTabClosed: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    if (tabId) {
      // remove callback; call w/ defaults
      const cb = messageBoxCallbacks[tabId]
      if (cb) {
        cleanupCallback(tabId)
        cb(false, '', false)
      }
    }
    return state
  },

  onTabUpdated: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.getIn(['tabValue', 'tabId'])
    const detail = tabMessageBoxState.getDetail(state, tabId)
    if (detail && detail.get('opener')) {
      const url = action.getIn(['tabValue', 'url'])
      // check if user has navigated away from site which opened the alert
      if (url && url !== detail.get('opener')) {
        const removeAction = makeImmutable({tabId: tabId})
        // remove detail from state
        state = tabMessageBoxState.removeDetail(state, removeAction)
        // remove callback; call w/ defaults
        const cb = messageBoxCallbacks[tabId]
        if (cb) {
          cleanupCallback(tabId)
          cb(false, '', false)
        }
      }
    }
    return state
  },

  getCallbacks: () => {
    return messageBoxCallbacks
  }
}

module.exports = tabMessageBox
