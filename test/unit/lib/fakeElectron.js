const fakeElectron = {
  BrowserWindow: {
    getFocusedWindow: function () {}
  },
  ipcMain: {
    on: function () { }
  },
  remote: {
    app: {
      on: function () {
      }
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
