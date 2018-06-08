/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const settings = require('../../../js/constants/settings')

// Utils
const { makeImmutable } = require('./immutableUtil')
const platformUtil = require('../lib/platformUtil')
const getSetting = require('../../../js/settings').getSetting
const {chromeUrl} = require('../../../js/lib/appUrlUtil')

const browserActionDefaults = Immutable.fromJS({
  tabs: {}
})

const extensionState = {

  getExtensions: (state) => {
    return state.get('extensions')
  },

  getEnabledExtensions: (state) => {
    const extensions = state.get('extensions')
    if (extensions) {
      return extensions.filter((installInfo, extensionId) => {
        return installInfo.get('enabled') === true
      })
    }
    return Immutable.fromJS([])
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

  browserActionBackgroundImage: (browserAction, tabId) => {
    tabId = tabId ? tabId.toString() : '-1'
    let path = browserAction.getIn(['tabs', tabId, 'path']) || browserAction.get('path')
    let basePath = chromeUrl(browserAction.get('base_path'))
    if (path && basePath) {
      // Older extensions may provide a string path
      if (typeof path === 'string') {
        return `-webkit-image-set(
                  url(${basePath}/${path}) 1x`
      }
      let basePath19 = path.get('19')
      let basePath38 = path.get('38')
      if (basePath19 && basePath38) {
        return `-webkit-image-set(
                  url(${basePath}/${basePath19}) 1x,
                  url(${basePath}/${basePath38}) 2x`
      }
    }
    return ''
  },

  extensionInstalled: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    return state.setIn(['extensions', extensionId], action.get('installInfo'))
  },

  extensionUninstalled: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    // Since we populate uninstalled extensions with dummyContent,
    // removing installInfo would just add dummy data instead of removing it
    // so we add a prop called 'excluded' and use it to hide extension on UI
    if (extension) {
      return state.setIn(['extensions', extensionId], extension.set('excluded', true))
    }
    return state
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
      return state.setIn(['extensions', extensionId], extension.set('enabled', false))
    } else {
      return state
    }
  },

  getPersistentTabState: (extension) => {
    extension = makeImmutable(extension)
    extensionState.getTransientFields().forEach((field) => {
      extension = extension.delete(field)
    })
    return extension
  },

  contextMenuCreated: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (extension) {
      if (state.getIn(['extensions', extensionId, 'contextMenus']) === undefined) {
        state = state.setIn(['extensions', extensionId, 'contextMenus'], new Immutable.List())
      }
      let contextMenus = state.getIn(['extensions', extensionId, 'contextMenus'])
      const basePath =
        platformUtil.getPathFromFileURI(state.getIn(['extensions', extensionId, 'base_path']))
      const iconPath = action.get('icon')
      if (!iconPath) {
        contextMenus = contextMenus.push({
          extensionId: extensionId,
          menuItemId: action.get('menuItemId'),
          properties: action.get('properties').toJS()
        })
      } else {
        contextMenus = contextMenus.push({
          extensionId: extensionId,
          menuItemId: action.get('menuItemId'),
          properties: action.get('properties').toJS(),
          icon: basePath + '/' + iconPath
        })
      }
      return state.setIn(['extensions', extensionId, 'contextMenus'],
        contextMenus)
    } else {
      return state
    }
  },

  contextMenuAllRemoved: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (extension) {
      return state.deleteIn(['extensions', extensionId, 'contextMenus'])
    } else {
      return state
    }
  },

  getContextMenusProperties: (state) => {
    let allProperties = []
    let extensions = extensionState.getEnabledExtensions(state)
    extensions && extensions.forEach((extension) => {
      let contextMenus = extension.get('contextMenus')
      contextMenus && contextMenus.forEach((contextMenu) => {
        allProperties.push(contextMenu.toJS())
      })
    })
    return allProperties
  },

  isWebTorrentEnabled: (state) => {
    if (state == null) {
      return false
    }

    const settingsState = state.get('settings')
    return getSetting(settings.TORRENT_VIEWER_ENABLED, settingsState)
  }
}

module.exports = extensionState
