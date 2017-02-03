const appActions = require('../../js/actions/appActions')
const messageBoxState = require('../common/state/messageBoxState')
const {makeImmutable} = require('../common/state/immutableUtil')

// callbacks for alert, confirm, etc.
let messageBoxCallbacks = {}

const cleanupCallback = (tabId) => {
  delete messageBoxCallbacks[tabId]
}

const messageBox = {
  show: (tabId, detail, cb) => {
    messageBoxCallbacks[tabId] = cb
    setImmediate(() => {
      appActions.showMessageBoxForTab(tabId, detail)
    })
  },

  close: (state, action) => {
    action = makeImmutable(action)
    let tabId = action.get('tabId')
    let detail = action.get('detail')
    state = messageBoxState.removeDetail(state, action)
    let cb = messageBoxCallbacks[tabId]
    let suppress = false
    let result = true
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
        cb(false, '', suppress)
      }
    }
    return state
  }
}

module.exports = messageBox
