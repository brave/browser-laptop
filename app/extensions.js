const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const AppStore = require('../js/stores/appStore')
const getExtensionsPath = require('../js/lib/appUrlUtil').getExtensionsPath
const getSetting = require('../js/settings').getSetting
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')

module.exports.init = () => {
  process.on('chrome-browser-action-popup', function (extensionId, name, props, popup) {
    let win = BrowserWindow.getFocusedWindow()
    if (!win) {
      return
    }

    win.webContents.send(messages.NEW_POPUP_WINDOW, extensionId, popup, props)
  })

  let installedExtensions = {}
  let extensionInstalled = (installInfo) => {
    if (installInfo.error) {
      console.error(installInfo.error)
    }
    installedExtensions[installInfo.name] = installInfo
  }

  let installExtension = function (name, path, options = {}) {
    process.emit('load-extension', name, path, options, extensionInstalled)
  }

  let enableExtension = (name) => {
    var installInfo = installedExtensions[name]
    if (installInfo) {
      process.emit('enable-extension', installInfo.id)
    }
  }

  let disableExtension = (name) => {
    var installInfo = installedExtensions[name]
    if (installInfo) {
      process.emit('disable-extension', installInfo.id)
    }
  }

  let enableExtensions = function () {
    installExtension('brave', getExtensionsPath(), {manifest_location: 'component'})

    if (getSetting(settings.ONE_PASSWORD_ENABLED)) {
      installExtension('1password', getExtensionsPath())
      enableExtension('1password')
    } else {
      disableExtension('1password')
    }

    if (getSetting(settings.DASHLANE_ENABLED)) {
      installExtension('dashlane', getExtensionsPath())
      enableExtension('dashlane')
    } else {
      disableExtension('dashlane')
    }
  }

  AppStore.addChangeListener(() => {
    enableExtensions()
  })
  enableExtensions()
}
