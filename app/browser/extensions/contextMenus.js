const extensionActions = require('../../common/actions/extensionActions')

const contextMenus = {
  init: () => {
    process.on('chrome-context-menus-remove-all', (extensionId) => {
      extensionActions.contextMenuAllRemoved(extensionId)
    })
    process.on('chrome-context-menus-remove', (extensionId, menuItemId) => {
      extensionActions.contextMenuRemoved(extensionId, menuItemId)
    })
    process.on('chrome-context-menus-create', (extensionId, menuItemId, properties, icon) => {
      extensionActions.contextMenuCreated(extensionId, menuItemId, properties, icon)
    })
    process.on('chrome-context-menus-update', (extensionId, menuItemId, properties) => {
      extensionActions.contextMenuUpdated(extensionId, menuItemId, properties)
    })
  }
}

module.exports = contextMenus
