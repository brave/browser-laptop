const {EventEmitter} = require('events')
const ipcMain = new EventEmitter()
ipcMain.send = ipcMain.emit
const fakeElectron = {
  reset: function () {
    fakeElectron.app.removeAllListeners()
    fakeElectron.remote.app.removeAllListeners()
    fakeElectron.autoUpdater.removeAllListeners()
  },
  BrowserWindow: {
    getFocusedWindow: function () {
      return {
        id: 1
      }
    },
    getActiveWindow: function () {
      return {
        id: 1
      }
    },
    getAllWindows: function () {
      return [{id: 1}]
    }
  },
  MenuItem: class {
    constructor (template) {
      this.template = template
    }
  },
  ipcMain,
  ipcRenderer: {
    on: function () { },
    send: function () { },
    sendSync: function () { }
  },
  remote: {
    app: new EventEmitter(),
    clipboard: {
      readText: function () { return '' }
    },
    getCurrentWindow: function () {
      return {
        on: () => {},
        isFocused: () => true,
        isFullScreen: () => false,
        isMaximized: () => false,
        webContents: {}
      }
    },
    Menu: {
      buildFromTemplate: (template) => {
        return require('./fakeElectronMenu')
      }
    }
  },
  app: Object.assign(new EventEmitter(), {
    getPath: (param) => `${process.cwd()}/${param}`,
    getVersion: () => '0.14.0',
    setLocale: (locale) => {},
    quit: () => {},
    exit: () => {}
  }),
  clipboard: {
    writeText: function () {
    }
  },
  dialog: {
    showOpenDialog: function () { }
  },
  Menu: {
    setApplicationMenu: (template) => {},
    buildFromTemplate: (template) => {
      return require('./fakeElectronMenu')
    }
  },
  shell: {
    openExternal: function () {
    },
    showItemInFolder: function () {
    },
    openItem: function () {
    },
    beep: function () {
    },
    moveItemToTrash: function () {
    }
  },
  session: {
    defaultSession: {
      partition: 'default',
      webRequest: {
        fetch: function (url, options, handler) {
        }
      }
    }
  },
  extensions: {
    createTab: function () {}
  },
  autoUpdater: new EventEmitter(),
  importer: {
    on: () => {}
  }
}

module.exports = fakeElectron
