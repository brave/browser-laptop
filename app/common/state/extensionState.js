/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabState = require('./tabState')
const { makeImmutable } = require('./immutableUtil')
const Immutable = require('immutable')

let transientFields = []

tabState.addTransientFields(['browserAction'])

const browserActionDefaults = Immutable.fromJS({
  tabs: {}
})

const extensionState = {

  getExtensions: (state) => {
    return state.get('extensions')
  },

  getEnabledExtensions: (state) => {
    return state.get('extensions').filter((installInfo, extensionId) => {
      return installInfo.get('enabled') === true
    })
  },

  getExtensionById: (state, extensionId) => {
    return state.getIn(['extensions', extensionId])
  },

  getBrowserActionByTabId: (state, extensionId, tabId) => {
    tabId = tabId ? tabId.toString() : '-1'
    let extension = extensionState.getExtensionById(state, extensionId)
    if (extension && extension.get('browserAction')) {
      let tabBrowserAction = extension.getIn(['tabs', tabId]) || Immutable.Map()
      return extension.get('browserAction').merge(tabBrowserAction).merge({base_path: extension.get('base_path')})
    }
    return null
  },

  browserActionRegistered: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (extension) {
      extension = extension.set('browserAction', browserActionDefaults.merge(action.get('browserAction')))
      return state.setIn(['extensions', extensionId], extension)
    } else {
      return state
    }
  },

  browserActionUpdated: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (extension && extension.get('browserAction')) {
      let tabId = action.get('tabId')
      if (tabId) {
        let tabs = extension.getIn(['browserAction', 'tabs'])
        let tab = tabs.get(tabId) || Immutable.Map()
        tabs = tabs.set(tabId, tab.merge(action.get('browserAction')))
        extension = extension.setIn(['browserAction', 'tabs'], tabs)
      } else {
        extension = extension.set('browserAction', extension.get('browserAction').merge(action.get('browserAction')))
      }
      return state.setIn(['extensions', extensionId], extension)
    } else {
      return state
    }
  },

  browserActionBackgroundImage: (browserAction) => {
    // TODO(bridiver) - handle icon single
    if (browserAction.get('base_path') && browserAction.getIn(['path', '19']) && browserAction.getIn(['path', '38'])) {
      return '-webkit-image-set(url(\'' + browserAction.get('base_path') + '/' + browserAction.getIn(['path', '19']) +
                                          '\') 1x, url(\'' + browserAction.get('base_path') + '/' + browserAction.getIn(['path', '38']) + '\') 2x'
    }
    return ''
  },

  extensionInstalled: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    return state.setIn(['extensions', extensionId], action.get('installInfo'))
  },

  extensionEnabled: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (extension) {
      return state.setIn(['extensions', extensionId], extension.set('enabled', true))
    } else {
      return state
    }
  },

  extensionDisabled: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (extension) {
      return state.setIn(['extensions', action.get('extensionId')], extension.set('enabled', false))
    } else {
      return state
    }
  },

  getTransientFields: () => {
    return transientFields
  },

  getPersistentTabState: (extension) => {
    extension = makeImmutable(extension)
    extensionState.getTransientFields().forEach((field) => {
      extension = extension.delete(field)
    })
    return extension
  }
}

module.exports = extensionState
