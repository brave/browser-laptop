const extensionActions = require('../../common/actions/extensionActions')

const contextMenus = {
  init: () => {
    process.on('chrome-context-menus-remove-all', (extensionId) => {
      setImmediate(() => {
        extensionActions.contextMenuAllRemoved(extensionId)
      })
    })
    process.on('chrome-context-menus-create', (extensionId, menuItemId, properties) => {
      setImmediate(() => {
        extensionActions.contextMenuCreated(extensionId, menuItemId, properties)
      })
    })
  }
}

module.exports = contextMenus
