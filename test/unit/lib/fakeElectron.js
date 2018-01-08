const {EventEmitter} = require('events')
const FakeElectronDisplay = require('./fakeElectronDisplay')
const FakeElectronWindow = require('./fakeWindow')
const ipcMain = new EventEmitter()
ipcMain.send = ipcMain.emit
const fakeElectron = {
  reset: function () {
    fakeElectron.app.removeAllListeners()
    fakeElectron.remote.app.removeAllListeners()
    fakeElectron.autoUpdater.removeAllListeners()
  },
  BrowserWindow: FakeElectronWindow,
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
    showDialog: function () { }
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
    },
    fromPartition: function (partition) {
      if (!partition.startsWith('persist:') || partition === 'tor') {
        return {
          isOffTheRecord: function () { return true }
        }
      } else {
        return {
          isOffTheRecord: function () { return false }
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
  },
  screen: {
    getDisplayMatching: () => new FakeElectronDisplay(),
    getPrimaryDisplay: () => new FakeElectronDisplay(),
    getDisplayNearestPoint: () => new FakeElectronDisplay(),
    getAllDisplays: () => [new FakeElectronDisplay()],
    getCursorScreenPoint: () => ({ x: 200, y: 200 })
  }
}

module.exports = fakeElectron
