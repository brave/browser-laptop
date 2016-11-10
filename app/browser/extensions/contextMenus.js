const extensionActions = require('../../common/actions/extensionActions')

const contextMenus = {
  init: () => {
    process.on('chrome-context-menus-remove-all', (extensionId) => {
      setImmediate(() => {
        extensionActions.contextMenuAllRemoved(extensionId)
      })
    })
    process.on('chrome-context-menus-create', (extensionId, menuItemId, properties, icon) => {
      setImmediate(() => {
        extensionActions.contextMenuCreated(extensionId, menuItemId, properties, icon)
      })
    })
  }
}

module.exports = contextMenus
