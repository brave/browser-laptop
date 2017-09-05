const appActions = require('../../../js/actions/appActions')

const windows = {
  init: () => {
    process.on('chrome-windows-create', (extensionId) => {
      appActions.newWindow()
    })
  }
}

module.exports = windows
