const fakeElectron = {
  BrowserWindow: {
    getFocusedWindow: function () {}
  },
  ipcMain: {
    on: function () { },
    send: function () { }
  },
  ipcRenderer: {
    on: function () { },
    send: function () { }
  },
  remote: {
    app: {
      on: function () {
      }
    },
    getCurrentWindow: function () {
      return {}
    }
  },
  app: {
    on: function () {
    }
  },
  clipboard: {
    writeText: function () {
    }
  },
  shell: {
    showItemInFolder: function () {
    },
    openItem: function () {
    },
    beep: function () {
    },
    moveItemToTrash: function () {
    }
  }
}

module.exports = fakeElectron
