const appActions = require('../../js/actions/appActions')
const tabMessageBoxState = require('../common/state/tabMessageBoxState')
const {makeImmutable} = require('../common/state/immutableUtil')
const locale = require('../../app/locale')

// callbacks for alert, confirm, etc.
let messageBoxCallbacks = {}

const cleanupCallback = (tabId) => {
  if (messageBoxCallbacks[tabId]) {
    delete messageBoxCallbacks[tabId]
    return true
  }
  return false
}

const onWindowPrompt = show => (webContents, extraData, title, message, defaultPromptText,
                               shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, muonCb) => {
  const tabId = webContents.getId()
  const detail = {
    message,
    title,
    buttons: [locale.translation('messageBoxOk'), locale.translation('messageBoxCancel')],
    cancelId: 1,
    suppress: false,
    allowInput: true,
    defaultPromptText,
    showSuppress: shouldDisplaySuppressCheckbox
  }

  show(tabId, detail, muonCb)
}

const tabMessageBox = {
  init: (state, action) => {
    process.on('window-alert', (webContents, extraData, title, message, defaultPromptText,
      shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, muonCb) => {
      const tabId = webContents.getId()
      const detail = {
        message,
        title,
        buttons: [locale.translation('messageBoxOk')],
        suppress: false,
        showSuppress: shouldDisplaySuppressCheckbox
      }

      tabMessageBox.show(tabId, detail, muonCb)
    })

    process.on('window-confirm', (webContents, extraData, title, message, defaultPromptText,
        shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, muonCb) => {
      const tabId = webContents.getId()
      const detail = {
        message,
        title,
        buttons: [locale.translation('messageBoxOk'), locale.translation('messageBoxCancel')],
        cancelId: 1,
        suppress: false,
        showSuppress: shouldDisplaySuppressCheckbox
      }

      tabMessageBox.show(tabId, detail, muonCb)
    })

    process.on('window-prompt', onWindowPrompt(tabMessageBox.show))

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
    const muonCb = messageBoxCallbacks[tabId]
    let suppress = false
    let result = true
    let input = ''
    state = tabMessageBoxState.removeDetail(state, action)
    if (muonCb) {
      cleanupCallback(tabId)
      if (detail) {
        if (detail.has('suppress')) {
          suppress = detail.get('suppress')
        }
        if (detail.has('result')) {
          result = detail.get('result')
        }
        if (detail.has('input')) {
          input = detail.get('input')
        }
        muonCb(result, input, suppress)
      } else {
        muonCb(false, '', false)
      }
    }
    return state
  },

  onTabClosed: (state, action) => {
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    if (tabId) {
      // remove callback; call w/ defaults
      const muonCb = messageBoxCallbacks[tabId]
      if (muonCb) {
        cleanupCallback(tabId)
        muonCb(false, '', false)
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
        const muonCb = messageBoxCallbacks[tabId]
        if (muonCb) {
          cleanupCallback(tabId)
          muonCb(false, '', false)
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
module.exports.onWindowPrompt = onWindowPrompt
