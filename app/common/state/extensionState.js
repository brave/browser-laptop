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
    if (!extension) {
      return state
    }
    extension = extension.set('browserAction', browserActionDefaults.merge(action.get('browserAction')))
    return state.setIn(['extensions', extensionId], extension)
  },

  browserActionUpdated: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (!extension) {
      return state
    }

    if (extension.get('browserAction')) {
      return state
    }

    let tabId = action.get('tabId')
    if (!tabId) {
      extension = extension.get('browserAction').merge(action.get('browserAction'))
    }

    let tabs = extension.getIn(['browserAction', 'tabs'])
    let tab = tabs.get(tabId) || Immutable.Map()
    tabs = tabs.set(tabId, tab.merge(action.get('browserAction')))
    extension = extension.setIn(['browserAction', 'tabs'], tabs)

    return state.setIn(['extensions', extensionId], extension)
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
    if (!extension) {
      return state
    }

    return state.setIn(['extensions', extensionId], extension.set('excluded', true))
  },

  extensionEnabled: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (!extension) {
      return state
    }

    return state.setIn(['extensions', extensionId], extension.set('enabled', true))
  },

  extensionDisabled: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (!extension) {
      return state
    }

    return state.setIn(['extensions', extensionId], extension.set('enabled', false))
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
    if (!extension) {
      return state
    }

    let contextMenus = state.getIn(['extensions', extensionId, 'contextMenus'])
    if (!contextMenus) {
      contextMenus = new Immutable.List()
    }

    let props = action.get('properties').toJS()
    let menu = {
      extensionId: extensionId,
      menuItemId: action.get('menuItemId')
    }

    const alreadyExists = (all, current) => all.map(m => m.menuItemId)
      .some(function (id) {
        return id.toString().toLowerCase() === current.menuItemId.toString().toLowerCase()
      })

    if (alreadyExists(contextMenus, menu)) {
      action.set('updateProperties', props)
      action.set('properties', undefined)
      return this.contextMenuUpdated(state, action)
    }
    menu.properties = menuProperties({}, props)
    menu.properties.id = menu.menuItemId

    const basePath = platformUtil.getPathFromFileURI(state.getIn(['extensions', extensionId, 'base_path']))
    const iconPath = action.get('icon')
    if (iconPath) {
      menu.icon = basePath + '/' + iconPath
    }

    contextMenus = contextMenus.push(menu)

    return state.setIn(['extensions', extensionId, 'contextMenus'], contextMenus)
  },

  contextMenuUpdated: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)

    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (!extension) {
      return state
    }

    let menuItemId = action.get('menuItemId').toString()
    if (!menuItemId) {
      return state
    }

    let props = action.get('updateProperties')
    if (!props) {
      return state
    }

    let menus = extension.get('contextMenus')
    let idx = Array.from(menus)
      .findIndex(m => m.menuItemId.toString().toLowerCase() === menuItemId.toString().toLowerCase())

    if (idx === -1) {
      action.set('properties', props)
      action.set('updateProperties', undefined)
      menus.push(this.contextMenuCreated(state, action))
      return state.setIn(['extensions', extensionId, 'contextMenus'], menus)
    }

    let menu = menus[idx]
    menu.menuItemId = menuItemId
    menu.properties = menuProperties(menu.properties, props)
    menu.properties.id = menuItemId

    menus[idx] = menu

    return state.setIn(['extensions', extensionId, 'contextMenus'], menus)
  },

  contextMenuRemoved: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)

    let menuItemId = action.get('menuItemId').toString()
    if (!menuItemId) {
      return state
    }

    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (!extension) {
      return state
    }

    let contextMenus = Array.from(extension.get('contextMenus'))
      .filter((contextMenu) => menuItemId !== contextMenu.menuItemId)

    return state.setIn(['extensions', extensionId, 'contextMenus'], contextMenus)
  },

  contextMenuAllRemoved: (state, action) => {
    action = makeImmutable(action)
    state = makeImmutable(state)
    let extensionId = action.get('extensionId').toString()
    let extension = extensionState.getExtensionById(state, extensionId)
    if (!extension) {
      return state
    }

    return state.deleteIn(['extensions', extensionId, 'contextMenus'])
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

function menuProperties (properties, props) {
  let updated = properties || {}

  updated = menuType(updated, props.type)
  updated = menuContexts(updated, props.contexts)

  if (props.title) {
    updated.title = props.title.toString()
  }
  if (props.visible) {
    updated.visible = Boolean(props.visible)
  }
  if (props.checked) {
    updated.checked = Boolean(props.checked)
  }
  if (props.parentId) {
    updated.parentId = props.parentId.toString()
  }

  // TODO https://github.com/brave/browser-laptop/issues/8331
  // TODO https://github.com/brave/browser-laptop/issues/8789
  // @see https://developer.chrome.com/extensions/contextMenus
  // if (props.enabled) {}
  // if (props.documentUrlPatterns) {}
  // if (props.targetUrlPatterns) {}

  return updated
}

function menuType (props, type) {
  if (typeof type !== 'string') {
    return props
  }

  let supported = ['normal', 'checkbox', 'radio', 'separator']
  if (!supported.some((t) => props.type.toLowerCase() === t)) {
    throw new Error('Unsupported `type` property. Acceptable values are:' + supported.toString())
  }

  return Object.assign(props, {type: type.toLowerCase()})
}

function menuContexts (props, contexts) {
  if (!contexts) {
    return props
  }

  if (!Array.isArray(contexts)) {
    contexts = [contexts]
  }

  let acceptable = [
    'all', 'page', 'frame', 'selection', 'link', 'editable',
    'image', 'video', 'audio', 'launcher', 'browser_action', 'page_action'
  ]

  function isSupported (c) {
    if (typeof c !== 'string') {
      return false
    }

    if (c === '') {
      return true
    }

    return acceptable.includes(c.toLowerCase())
  }

  if (!contexts.every((c) => isSupported(c.trim()))) {
    throw new Error('At least one `context` is not supported. Acceptable values are:' + acceptable.toString())
  }

  return Object.assign(props, {contexts: contexts.map(c => c.toLowerCase())})
}

module.exports = extensionState
